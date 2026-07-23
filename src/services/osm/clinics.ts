import { z } from "zod";
import type { ClinicSearchFilters, OpenStreetMapClinic } from "@/domain/types";
import { logEvent } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";

const nominatimResultSchema = z.object({
  boundingbox: z.tuple([z.string(), z.string(), z.string(), z.string()]),
});

const overpassElementSchema = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number().int().positive(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).optional(),
});

const overpassResponseSchema = z.object({
  elements: z.array(overpassElementSchema).max(2_000).default([]),
});

type Bounds = { south: number; north: number; west: number; east: number };
type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;
type OsmErrorCode = "LOCATION_REQUIRED" | "LOCATION_NOT_FOUND" | "RATE_LIMITED" | "UPSTREAM_ERROR" | "INVALID_RESPONSE";
type CacheEntry<T> = { expiresAt: number; value: T };
type OsmGlobals = {
  osmGeocodeCache?: Map<string, CacheEntry<Bounds>>;
  osmClinicCache?: Map<string, CacheEntry<OpenStreetMapClinic[]>>;
  osmBudget?: { minute: number; count: number };
  lastNominatimRequestAt?: number;
};

const osmGlobals = globalThis as unknown as OsmGlobals;
osmGlobals.osmGeocodeCache ??= new Map();
osmGlobals.osmClinicCache ??= new Map();

const specialtyLabels: Record<string, string> = {
  dentistry: "Diş hekimliği",
  implantology: "İmplantoloji",
  orthodontics: "Ortodonti",
  endodontics: "Endodonti",
  pediatric_dentistry: "Çocuk diş hekimliği",
  periodontics: "Periodontoloji",
  stomatology: "Ağız ve diş sağlığı",
  dental_oral_maxillo_facial_surgery: "Ağız, diş ve çene cerrahisi",
};

export class OsmClinicError extends Error {
  constructor(public readonly code: OsmErrorCode, public readonly status?: number) {
    super(code);
  }
}

function numberFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
}

function endpointFromEnv(name: "OSM_NOMINATIM_URL" | "OSM_OVERPASS_URL", fallback: string) {
  const configured = process.env[name]?.trim() || fallback;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:") throw new Error("HTTPS_REQUIRED");
    return url.toString();
  } catch {
    throw new OsmClinicError("UPSTREAM_ERROR", 503);
  }
}

function appUserAgent() {
  const appUrl = process.env.APP_BASE_URL?.trim() || "https://discibul.example";
  return `Discibul/0.5 (${appUrl})`;
}

function normalize(value: string | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function cacheKey(filters: ClinicSearchFilters) {
  return encodeURIComponent(`${normalize(filters.city)}|${normalize(filters.district)}`);
}

async function readCache<T>(scope: "geocode" | "clinics", key: string): Promise<T | null> {
  const memory = scope === "geocode" ? osmGlobals.osmGeocodeCache : osmGlobals.osmClinicCache;
  const entry = memory?.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  if (entry) memory?.delete(key);

  try {
    const redis = await getRedisClient();
    const raw = redis ? await redis.get(`discibul:osm:${scope}:${key}`) : null;
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

async function writeCache<T>(scope: "geocode" | "clinics", key: string, value: T, ttlSeconds: number) {
  const memory = scope === "geocode" ? osmGlobals.osmGeocodeCache : osmGlobals.osmClinicCache;
  memory?.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 } as CacheEntry<Bounds> & CacheEntry<OpenStreetMapClinic[]>);
  try {
    const redis = await getRedisClient();
    if (redis) await redis.set(`discibul:osm:${scope}:${key}`, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // The in-process cache still protects the public services on a single instance.
  }
}

async function reserveNominatimRequest() {
  try {
    const redis = await getRedisClient();
    if (redis) {
      const reserved = await redis.set("discibul:osm:nominatim-lock", "1", { NX: true, PX: 1_100 });
      if (!reserved) throw new OsmClinicError("RATE_LIMITED", 429);
      return;
    }
  } catch (error) {
    if (error instanceof OsmClinicError) throw error;
  }

  const now = Date.now();
  if (now - (osmGlobals.lastNominatimRequestAt ?? 0) < 1_100) throw new OsmClinicError("RATE_LIMITED", 429);
  osmGlobals.lastNominatimRequestAt = now;
}

async function consumeOverpassBudget() {
  const limit = numberFromEnv(process.env.OSM_MAX_REQUESTS_PER_MINUTE, 30, 1, 120);
  try {
    const redis = await getRedisClient();
    if (redis) {
      const key = "discibul:osm:overpass-budget";
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 60);
      if (count > limit) throw new OsmClinicError("RATE_LIMITED", 429);
      return;
    }
  } catch (error) {
    if (error instanceof OsmClinicError) throw error;
  }

  const minute = Math.floor(Date.now() / 60_000);
  if (!osmGlobals.osmBudget || osmGlobals.osmBudget.minute !== minute) osmGlobals.osmBudget = { minute, count: 1 };
  else osmGlobals.osmBudget.count += 1;
  if (osmGlobals.osmBudget.count > limit) throw new OsmClinicError("RATE_LIMITED", 429);
}

function safeWebsite(value: string | undefined) {
  if (!value) return null;
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function addressFromTags(tags: Record<string, string>, filters: ClinicSearchFilters) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const parts = [
    street,
    tags["addr:neighbourhood"] || tags["addr:quarter"] || tags["addr:suburb"],
    tags["addr:district"] || filters.district,
    tags["addr:city"] || tags["addr:province"] || filters.city,
  ].filter(Boolean);
  return [...new Set(parts)].join(", ") || "Adres OpenStreetMap üzerinde görüntülenebilir.";
}

function specialtiesFromTags(tags: Record<string, string>) {
  const values = (tags["healthcare:speciality"] || "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean);
  return values.map((value) => specialtyLabels[value] || value.replaceAll("_", " "));
}

export function mapOsmClinic(
  element: z.infer<typeof overpassElementSchema>,
  filters: ClinicSearchFilters,
): OpenStreetMapClinic | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};
  const name = tags.name || tags.operator || tags.brand;
  if (typeof latitude !== "number" || typeof longitude !== "number" || !name) return null;
  const formattedAddress = addressFromTags(tags, filters);
  const googleQuery = [name, formattedAddress].filter(Boolean).join(" ");

  return {
    osmType: element.type,
    osmId: element.id,
    name,
    formattedAddress,
    city: tags["addr:city"] || tags["addr:province"] || filters.city || null,
    district: tags["addr:district"] || tags["addr:suburb"] || filters.district || null,
    latitude,
    longitude,
    phone: tags["contact:phone"] || tags.phone || null,
    websiteUrl: safeWebsite(tags["contact:website"] || tags.website),
    openingHours: tags.opening_hours || null,
    wheelchairAccess: tags.wheelchair === "yes" ? true : tags.wheelchair === "no" ? false : null,
    specialties: specialtiesFromTags(tags),
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    googleSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleQuery)}`,
  };
}

export class OsmClinicClient {
  constructor(
    private readonly fetcher: FetchLike = fetch,
    private readonly safeguardsEnabled = true,
    private readonly cacheEnabled = true,
  ) {}

  private async geocode(filters: ClinicSearchFilters) {
    if (!filters.city?.trim()) throw new OsmClinicError("LOCATION_REQUIRED", 400);
    const key = cacheKey(filters);
    if (this.cacheEnabled) {
      const cached = await readCache<Bounds>("geocode", key);
      if (cached) return cached;
    }
    if (this.safeguardsEnabled) await reserveNominatimRequest();

    const endpoint = new URL(endpointFromEnv("OSM_NOMINATIM_URL", "https://nominatim.openstreetmap.org/search"));
    endpoint.searchParams.set("q", [filters.district, filters.city, "Türkiye"].filter(Boolean).join(", "));
    endpoint.searchParams.set("format", "jsonv2");
    endpoint.searchParams.set("limit", "1");
    endpoint.searchParams.set("countrycodes", "tr");
    endpoint.searchParams.set("addressdetails", "0");

    const response = await this.request(endpoint, { method: "GET" }, "nominatim");
    const raw = await response.json() as unknown;
    const parsed = z.array(nominatimResultSchema).max(1).safeParse(raw);
    if (!parsed.success) throw new OsmClinicError("INVALID_RESPONSE", 502);
    const hit = parsed.data[0];
    if (!hit) throw new OsmClinicError("LOCATION_NOT_FOUND", 404);
    const [south, north, west, east] = hit.boundingbox.map(Number);
    const bounds = { south, north, west, east };
    if (Object.values(bounds).some((value) => !Number.isFinite(value))) throw new OsmClinicError("INVALID_RESPONSE", 502);
    if (this.cacheEnabled) await writeCache("geocode", key, bounds, numberFromEnv(process.env.OSM_GEOCODE_CACHE_SECONDS, 604_800, 3_600, 2_592_000));
    return bounds;
  }

  private async request(input: string | URL, init: RequestInit, scope: "nominatim" | "overpass") {
    const timeoutMs = numberFromEnv(process.env.OSM_TIMEOUT_MS, 12_000, 2_000, 30_000);
    let response: Response;
    try {
      response = await this.fetcher(input, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/json",
          "Accept-Language": "tr-TR,tr;q=0.9",
          Referer: process.env.APP_BASE_URL || "https://discibul.example",
          "User-Agent": appUserAgent(),
          ...init.headers,
        },
      });
    } catch (error) {
      logEvent("warn", "osm_request_failed", { scope, reason: error instanceof Error ? error.name : "unknown" });
      throw new OsmClinicError("UPSTREAM_ERROR", 503);
    }
    if (response.status === 429 || response.status === 504) throw new OsmClinicError("RATE_LIMITED", response.status);
    if (!response.ok) {
      logEvent("warn", "osm_upstream_error", { scope, status: response.status });
      throw new OsmClinicError("UPSTREAM_ERROR", response.status);
    }
    return response;
  }

  async searchDentalClinics(filters: ClinicSearchFilters) {
    if (!filters.city?.trim()) throw new OsmClinicError("LOCATION_REQUIRED", 400);
    const key = cacheKey(filters);
    const resultLimit = numberFromEnv(process.env.OSM_MAX_RESULTS, 30, 5, 50);
    if (this.cacheEnabled) {
      const cached = await readCache<OpenStreetMapClinic[]>("clinics", key);
      if (cached) return cached.slice(0, resultLimit);
    }
    const bounds = await this.geocode(filters);
    if (this.safeguardsEnabled) await consumeOverpassBudget();
    const bbox = `${bounds.south},${bounds.west},${bounds.north},${bounds.east}`;
    const query = `[out:json][timeout:20];(
      nwr["amenity"="dentist"](${bbox});
      nwr["healthcare"="dentist"](${bbox});
      nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology",i](${bbox});
    );out center 100;`;
    const response = await this.request(
      endpointFromEnv("OSM_OVERPASS_URL", "https://overpass-api.de/api/interpreter"),
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: `data=${encodeURIComponent(query)}` },
      "overpass",
    );
    const contentLength = Number(response.headers.get("content-length") || "0");
    if (contentLength > 3_000_000) throw new OsmClinicError("INVALID_RESPONSE", 502);
    const parsed = overpassResponseSchema.safeParse(await response.json() as unknown);
    if (!parsed.success) throw new OsmClinicError("INVALID_RESPONSE", 502);
    const unique = new Map<string, OpenStreetMapClinic>();
    for (const element of parsed.data.elements) {
      const clinic = mapOsmClinic(element, filters);
      if (clinic) unique.set(`${clinic.osmType}/${clinic.osmId}`, clinic);
    }
    const clinics = [...unique.values()].slice(0, resultLimit);
    if (this.cacheEnabled) await writeCache("clinics", key, clinics, numberFromEnv(process.env.OSM_RESULT_CACHE_SECONDS, 1_800, 300, 86_400));
    return clinics;
  }
}

export function getOsmClinicClient() {
  return new OsmClinicClient();
}
