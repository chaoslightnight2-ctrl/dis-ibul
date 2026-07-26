import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  ClinicSearchFilters,
  GooglePlaceDetails,
  GooglePlaceReview,
  GooglePlaceSearchResult,
} from "@/domain/types";
import { getRedisClient } from "@/lib/redis";
import { logEvent } from "@/lib/logger";

const localizedTextSchema = z.object({
  text: z.string(),
  languageCode: z.string().optional(),
});

const addressComponentSchema = z.object({
  longText: z.string().optional(),
  shortText: z.string().optional(),
  types: z.array(z.string()).default([]),
});

const reviewSchema = z.object({
  name: z.string().optional(),
  relativePublishTimeDescription: z.string().optional(),
  text: localizedTextSchema.optional(),
  originalText: localizedTextSchema.optional(),
  rating: z.number().min(1).max(5),
  authorAttribution: z.object({
    displayName: z.string(),
    uri: z.string().optional(),
    photoUri: z.string().optional(),
  }),
  publishTime: z.string().optional(),
  flagContentUri: z.string().optional(),
  googleMapsUri: z.string().optional(),
  visitDate: z.object({ year: z.number().int(), month: z.number().int() }).optional(),
});

const placeSchema = z.object({
  id: z.string(),
  displayName: localizedTextSchema,
  formattedAddress: z.string().optional(),
  addressComponents: z.array(addressComponentSchema).optional(),
  rating: z.number().min(1).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  googleMapsUri: z.string().optional(),
  googleMapsLinks: z.object({
    placeUri: z.string().optional(),
    writeAReviewUri: z.string().optional(),
    reviewsUri: z.string().optional(),
  }).optional(),
  currentOpeningHours: z.object({
    openNow: z.boolean().optional(),
    weekdayDescriptions: z.array(z.string()).optional(),
  }).optional(),
  websiteUri: z.string().optional(),
  nationalPhoneNumber: z.string().optional(),
  businessStatus: z.string().optional(),
  reviews: z.array(reviewSchema).max(5).optional(),
});

const searchResponseSchema = z.object({ places: z.array(placeSchema).optional() });

type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type GooglePlacesErrorCode = "NOT_CONFIGURED" | "RATE_LIMITED" | "UPSTREAM_ERROR" | "INVALID_RESPONSE";
type CacheEntry = { expiresAt: number; value: unknown };
type BudgetEntry = { window: string; count: number };
type BudgetGlobals = {
  googlePlacesBudget?: Map<string, BudgetEntry>;
  googlePlacesCache?: Map<string, CacheEntry>;
};

const budgetGlobals = globalThis as unknown as BudgetGlobals;
budgetGlobals.googlePlacesBudget ??= new Map();
budgetGlobals.googlePlacesCache ??= new Map();
const searchFieldMask = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.rating",
  "places.userRatingCount",
  "places.googleMapsUri",
  "places.googleMapsLinks",
  "places.currentOpeningHours.openNow",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.businessStatus",
].join(",");
const detailsFieldMask = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "rating",
  "userRatingCount",
  "googleMapsUri",
  "googleMapsLinks",
  "currentOpeningHours.openNow",
  "currentOpeningHours.weekdayDescriptions",
  "websiteUri",
  "nationalPhoneNumber",
  "businessStatus",
  "reviews",
].join(",");

export class GooglePlacesError extends Error {
  constructor(public readonly code: GooglePlacesErrorCode, public readonly status?: number) {
    super(code);
  }
}

function safeHttpUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function addressPart(place: z.infer<typeof placeSchema>, wantedTypes: string[]) {
  const component = place.addressComponents?.find((item) => wantedTypes.some((type) => item.types.includes(type)));
  return component?.longText ?? component?.shortText ?? null;
}

function businessStatus(value: string | undefined): GooglePlaceSearchResult["businessStatus"] {
  if (value === "OPERATIONAL" || value === "CLOSED_TEMPORARILY" || value === "CLOSED_PERMANENTLY" || value === "FUTURE_OPENING") return value;
  return "UNKNOWN";
}

function fallbackMapsUrl(placeId: string) {
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}`;
}

function fallbackWriteReviewUrl(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

function toReview(review: z.infer<typeof reviewSchema>, placeId: string, index: number): GooglePlaceReview {
  const translated = Boolean(
    review.text?.text
    && review.originalText?.text
    && (review.text.text !== review.originalText.text || review.text.languageCode !== review.originalText.languageCode),
  );
  const visitDate = review.visitDate
    ? `${String(review.visitDate.year).padStart(4, "0")}-${String(review.visitDate.month).padStart(2, "0")}`
    : null;

  return {
    id: review.name ?? `${placeId}-${index}`,
    authorName: review.authorAttribution.displayName,
    authorUri: safeHttpUrl(review.authorAttribution.uri),
    authorPhotoUri: safeHttpUrl(review.authorAttribution.photoUri),
    rating: review.rating,
    text: review.text?.text ?? null,
    originalText: review.originalText?.text ?? null,
    translated,
    relativePublishTime: review.relativePublishTimeDescription ?? null,
    publishTime: review.publishTime ?? null,
    googleMapsUri: safeHttpUrl(review.googleMapsUri) ?? fallbackMapsUrl(placeId),
    flagContentUri: safeHttpUrl(review.flagContentUri),
    visitDate,
  };
}

export function mapGooglePlace(place: z.infer<typeof placeSchema>): GooglePlaceDetails {
  const mapsUrl = safeHttpUrl(place.googleMapsLinks?.placeUri)
    ?? safeHttpUrl(place.googleMapsUri)
    ?? fallbackMapsUrl(place.id);

  return {
    placeId: place.id,
    name: place.displayName.text,
    formattedAddress: place.formattedAddress ?? "Adres bilgisi Google Maps'te görüntülenebilir.",
    city: addressPart(place, ["administrative_area_level_1", "locality"]),
    district: addressPart(place, ["administrative_area_level_2", "sublocality_level_1", "sublocality"]),
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? 0,
    openNow: place.currentOpeningHours?.openNow ?? null,
    businessStatus: businessStatus(place.businessStatus),
    mapsUrl,
    reviewsUrl: safeHttpUrl(place.googleMapsLinks?.reviewsUri),
    writeReviewUrl: safeHttpUrl(place.googleMapsLinks?.writeAReviewUri) ?? fallbackWriteReviewUrl(place.id),
    websiteUrl: safeHttpUrl(place.websiteUri),
    phone: place.nationalPhoneNumber ?? null,
    weekdayDescriptions: place.currentOpeningHours?.weekdayDescriptions ?? [],
    reviews: (place.reviews ?? []).map((review, index) => toReview(review, place.id, index)),
  };
}

function numberFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
}

function cacheDigest(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function readGoogleCache(key: string) {
  const memoryEntry = budgetGlobals.googlePlacesCache?.get(key);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) return memoryEntry.value;
  if (memoryEntry) budgetGlobals.googlePlacesCache?.delete(key);

  try {
    const redis = await getRedisClient();
    if (redis) {
      const cached = await redis.get(`discibul:google-places-cache:${key}`);
      if (cached) return JSON.parse(cached) as unknown;
    }
  } catch {
    // Cache failures must not make clinic search unavailable.
  }
  return null;
}

async function writeGoogleCache(key: string, value: unknown, ttlSeconds: number) {
  budgetGlobals.googlePlacesCache?.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  try {
    const redis = await getRedisClient();
    if (redis) await redis.set(`discibul:google-places-cache:${key}`, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // The in-process cache still protects the configured Google quota.
  }
}

async function consumeBudgetWindow(scope: "search" | "details", unit: "minute" | "month", window: string, limit: number, ttlSeconds: number) {
  const key = `discibul:google-places-budget:${unit}:${scope}:${window}`;
  try {
    const redis = await getRedisClient();
    if (redis) {
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, ttlSeconds);
      if (count > limit) throw new GooglePlacesError("RATE_LIMITED", 429);
      return;
    }
  } catch (error) {
    if (error instanceof GooglePlacesError) throw error;
    if (process.env.NODE_ENV === "production") throw new GooglePlacesError("UPSTREAM_ERROR", 503);
  }

  const memoryKey = `${unit}:${scope}`;
  const current = budgetGlobals.googlePlacesBudget?.get(memoryKey);
  if (!current || current.window !== window) {
    budgetGlobals.googlePlacesBudget?.set(memoryKey, { window, count: 1 });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new GooglePlacesError("RATE_LIMITED", 429);
}

async function consumeGoogleBudget(scope: "search" | "details") {
  const minuteLimit = numberFromEnv(process.env.GOOGLE_PLACES_MAX_REQUESTS_PER_MINUTE, 90, 1, 1_000);
  const monthlyLimit = numberFromEnv(process.env.GOOGLE_PLACES_MAX_REQUESTS_PER_MONTH, 900, 1, 1_000);
  const now = new Date();
  const minuteWindow = String(Math.floor(now.getTime() / 60_000));
  const monthWindow = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await consumeBudgetWindow(scope, "minute", minuteWindow, minuteLimit, 120);
  await consumeBudgetWindow(scope, "month", monthWindow, monthlyLimit, 35 * 24 * 60 * 60);
}

export class GooglePlacesApiClient {
  constructor(
    private readonly apiKey: string,
    private readonly fetcher: FetchLike = fetch,
    private readonly budgetEnabled = true,
  ) {}

  private async request(url: string, fieldMask: string, init: RequestInit, scope: "search" | "details") {
    if (this.budgetEnabled) await consumeGoogleBudget(scope);
    const timeoutMs = numberFromEnv(process.env.GOOGLE_PLACES_TIMEOUT_MS, 8_000, 1_000, 20_000);
    let response: Response;
    try {
      response = await this.fetcher(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": fieldMask,
          ...init.headers,
        },
      });
    } catch (error) {
      logEvent("warn", "google_places_request_failed", { scope, reason: error instanceof Error ? error.name : "unknown" });
      throw new GooglePlacesError("UPSTREAM_ERROR", 503);
    }

    if (response.status === 429) throw new GooglePlacesError("RATE_LIMITED", 429);
    if (!response.ok) {
      logEvent("warn", "google_places_upstream_error", { scope, status: response.status });
      throw new GooglePlacesError("UPSTREAM_ERROR", response.status);
    }
    return response.json() as Promise<unknown>;
  }

  async searchDentalClinics(filters: ClinicSearchFilters) {
    const location = [filters.district, filters.city, "Türkiye"].filter(Boolean).join(" ");
    const subject = [filters.q, filters.treatment].filter(Boolean).join(" ");
    const textQuery = `${subject ? `${subject} ` : ""}diş kliniği ${location}`.trim().slice(0, 250);
    const minRating = typeof filters.minGoogleRating === "number"
      ? Math.ceil(filters.minGoogleRating * 2) / 2
      : undefined;
    const pageSize = numberFromEnv(process.env.GOOGLE_PLACES_PAGE_SIZE, 20, 1, 20);
    const payload = {
      textQuery,
      includedType: "dental_clinic",
      strictTypeFiltering: false,
      includePureServiceAreaBusinesses: false,
      languageCode: "tr",
      regionCode: "TR",
      pageSize,
      ...(typeof minRating === "number" ? { minRating } : {}),
    };
    const cacheKey = `search:${cacheDigest(payload)}`;
    const cached = this.budgetEnabled ? await readGoogleCache(cacheKey) : null;
    if (cached) {
      const parsed = searchResponseSchema.safeParse(cached);
      if (parsed.success) return (parsed.data.places ?? []).map(mapGooglePlace);
    }
    const raw = await this.request(
      "https://places.googleapis.com/v1/places:searchText",
      searchFieldMask,
      { method: "POST", body: JSON.stringify(payload) },
      "search",
    );
    const parsed = searchResponseSchema.safeParse(raw);
    if (!parsed.success) throw new GooglePlacesError("INVALID_RESPONSE", 502);
    if (this.budgetEnabled) await writeGoogleCache(cacheKey, parsed.data, numberFromEnv(process.env.GOOGLE_PLACES_SEARCH_CACHE_SECONDS, 1_800, 60, 86_400));
    return (parsed.data.places ?? []).map(mapGooglePlace);
  }

  async getPlaceDetails(placeId: string) {
    const cacheKey = `details:${cacheDigest(placeId)}`;
    const cached = this.budgetEnabled ? await readGoogleCache(cacheKey) : null;
    if (cached) {
      const parsed = placeSchema.safeParse(cached);
      if (parsed.success) return mapGooglePlace(parsed.data);
    }
    const raw = await this.request(
      `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr&regionCode=TR`,
      detailsFieldMask,
      { method: "GET" },
      "details",
    );
    const parsed = placeSchema.safeParse(raw);
    if (!parsed.success) throw new GooglePlacesError("INVALID_RESPONSE", 502);
    if (this.budgetEnabled) await writeGoogleCache(cacheKey, parsed.data, numberFromEnv(process.env.GOOGLE_PLACES_DETAILS_CACHE_SECONDS, 3_600, 60, 86_400));
    return mapGooglePlace(parsed.data);
  }
}

export function isGooglePlacesConfigured(env: NodeJS.ProcessEnv = process.env) {
  return (env.GOOGLE_PROVIDER ?? "mock").toLowerCase() === "google" && Boolean(env.GOOGLE_MAPS_API_KEY?.trim());
}

export function getGooglePlacesClient() {
  if (!isGooglePlacesConfigured()) throw new GooglePlacesError("NOT_CONFIGURED", 503);
  return new GooglePlacesApiClient(process.env.GOOGLE_MAPS_API_KEY as string);
}
