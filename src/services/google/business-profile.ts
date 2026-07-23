import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";

const BUSINESS_SCOPE = "https://www.googleapis.com/auth/business.manage";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const REVOKE_URL = "https://oauth2.googleapis.com/revoke";
const ACCOUNT_API = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_API = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_API = "https://mybusiness.googleapis.com/v4";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_in: z.number().int().positive().optional(),
  refresh_token: z.string().min(1).optional(),
  scope: z.string().optional(),
  token_type: z.string().optional(),
});

const accountsResponseSchema = z.object({
  accounts: z.array(z.object({ name: z.string(), accountName: z.string().optional() })).optional(),
  nextPageToken: z.string().optional(),
});

const addressSchema = z.object({
  regionCode: z.string().optional(),
  administrativeArea: z.string().optional(),
  locality: z.string().optional(),
  postalCode: z.string().optional(),
  addressLines: z.array(z.string()).optional(),
}).optional();

const locationSchema = z.object({
  name: z.string(),
  title: z.string(),
  phoneNumbers: z.object({ primaryPhone: z.string().optional() }).optional(),
  storefrontAddress: addressSchema,
  websiteUri: z.string().optional(),
  metadata: z.object({
    mapsUri: z.string().optional(),
    newReviewUri: z.string().optional(),
  }).optional(),
});

const locationsResponseSchema = z.object({
  locations: z.array(locationSchema).optional(),
  nextPageToken: z.string().optional(),
});

const reviewSchema = z.object({
  reviewId: z.string().optional(),
  reviewer: z.object({ displayName: z.string().optional(), isAnonymous: z.boolean().optional() }).optional(),
  starRating: z.enum(["ONE", "TWO", "THREE", "FOUR", "FIVE"]),
  comment: z.string().optional(),
  createTime: z.string().optional(),
  updateTime: z.string().optional(),
  reviewReply: z.object({ comment: z.string().optional(), updateTime: z.string().optional() }).optional(),
});

const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema).optional(),
  averageRating: z.number().min(0).max(5).optional(),
  totalReviewCount: z.number().int().nonnegative().optional(),
});

export type GoogleBusinessConfig = {
  clientId: string;
  clientSecret: string;
  encryptionKey: Buffer;
  redirectUri: string;
};

export type GoogleBusinessLocation = {
  resourceName: string;
  accountName: string;
  locationName: string;
  title: string;
  phone: string | null;
  address: string;
  websiteUrl: string | null;
  mapsUrl: string | null;
  writeReviewUrl: string | null;
};

export type GoogleBusinessReview = {
  sourceReviewId: string | null;
  authorDisplayName: string;
  rating: number;
  text: string | null;
  clinicResponse: string | null;
  publishedAt: Date | null;
};

export class GoogleBusinessProfileError extends Error {
  constructor(public readonly code: string, public readonly status = 502) {
    super(code);
    this.name = "GoogleBusinessProfileError";
  }
}

function encryptionKey(value: string | undefined) {
  if (!value || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;
  const key = Buffer.from(value || "", "base64");
  return key.length === 32 ? key : null;
}

export function getGoogleBusinessConfig(env: NodeJS.ProcessEnv = process.env): GoogleBusinessConfig | null {
  const clientId = env.GOOGLE_BUSINESS_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_BUSINESS_CLIENT_SECRET?.trim();
  const key = encryptionKey(env.GOOGLE_BUSINESS_TOKEN_ENCRYPTION_KEY);
  const baseUrl = env.APP_BASE_URL?.trim();
  if (!clientId || !clientSecret || !key || !baseUrl) return null;

  let redirectUri: string;
  try {
    const parsedBaseUrl = new URL(baseUrl);
    const allowedProtocols = env.NODE_ENV === "production" ? ["https:"] : ["http:", "https:"];
    if (!allowedProtocols.includes(parsedBaseUrl.protocol)) return null;
    redirectUri = new URL("/api/clinic/google-business/callback", parsedBaseUrl.origin).toString();
  } catch {
    return null;
  }
  return { clientId, clientSecret, encryptionKey: key, redirectUri };
}

export function isGoogleBusinessConfigured(env: NodeJS.ProcessEnv = process.env) {
  return getGoogleBusinessConfig(env) !== null;
}

export function encryptGoogleRefreshToken(token: string, clinicId: string, key: Buffer) {
  if (key.length !== 32) throw new GoogleBusinessProfileError("INVALID_ENCRYPTION_KEY", 500);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`discibul:google-business:${clinicId}`, "utf8"));
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ["v1", iv.toString("base64url"), encrypted.toString("base64url"), tag.toString("base64url")].join(".");
}

export function decryptGoogleRefreshToken(value: string, clinicId: string, key: Buffer) {
  const [version, ivValue, encryptedValue, tagValue] = value.split(".");
  if (version !== "v1" || !ivValue || !encryptedValue || !tagValue || key.length !== 32) {
    throw new GoogleBusinessProfileError("OAUTH_TOKEN_INVALID", 500);
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivValue, "base64url"));
    decipher.setAAD(Buffer.from(`discibul:google-business:${clinicId}`, "utf8"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new GoogleBusinessProfileError("OAUTH_TOKEN_INVALID", 500);
  }
}

export function buildGoogleBusinessAuthorizationUrl(config: GoogleBusinessConfig, state: string) {
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", BUSINESS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url;
}

async function parsedResponse<T>(response: Response, schema: z.ZodType<T>, errorCode: string) {
  if (!response.ok) throw new GoogleBusinessProfileError(`${errorCode}_${response.status}`, response.status === 401 ? 401 : 502);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new GoogleBusinessProfileError(`${errorCode}_INVALID_RESPONSE`);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new GoogleBusinessProfileError(`${errorCode}_INVALID_RESPONSE`);
  return parsed.data;
}

async function googleFetch(url: string, init: RequestInit, fetcher: typeof fetch, errorCode: string) {
  try {
    return await fetcher(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new GoogleBusinessProfileError(`${errorCode}_UNAVAILABLE`, 503);
  }
}

export async function exchangeGoogleBusinessCode(config: GoogleBusinessConfig, code: string, fetcher: typeof fetch = fetch) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });
  const response = await googleFetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }, fetcher, "TOKEN_EXCHANGE");
  return parsedResponse(response, tokenResponseSchema, "TOKEN_EXCHANGE");
}

export async function refreshGoogleBusinessAccessToken(config: GoogleBusinessConfig, refreshToken: string, fetcher: typeof fetch = fetch) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await googleFetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }, fetcher, "TOKEN_REFRESH");
  return parsedResponse(response, tokenResponseSchema, "TOKEN_REFRESH");
}

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

function displayAddress(address: z.infer<typeof addressSchema>) {
  if (!address) return "Adres Google tarafında belirtilmedi";
  return [
    ...(address.addressLines ?? []),
    address.locality,
    address.administrativeArea,
    address.postalCode,
  ].filter(Boolean).join(", ");
}

export async function listGoogleBusinessLocations(accessToken: string, fetcher: typeof fetch = fetch) {
  const accounts: Array<{ name: string; accountName?: string }> = [];
  let accountPageToken = "";
  for (let page = 0; page < 5 && accounts.length < 100; page += 1) {
    const url = new URL(`${ACCOUNT_API}/accounts`);
    url.searchParams.set("pageSize", "20");
    if (accountPageToken) url.searchParams.set("pageToken", accountPageToken);
    const response = await googleFetch(url.toString(), { headers: authHeaders(accessToken) }, fetcher, "ACCOUNTS_LIST");
    const data = await parsedResponse(response, accountsResponseSchema, "ACCOUNTS_LIST");
    accounts.push(...(data.accounts ?? []).filter((account) => /^accounts\/[^/]+$/.test(account.name)));
    if (!data.nextPageToken) break;
    accountPageToken = data.nextPageToken;
  }

  const locations: GoogleBusinessLocation[] = [];
  for (const account of accounts) {
    let locationPageToken = "";
    for (let page = 0; page < 5 && locations.length < 100; page += 1) {
      const url = new URL(`${BUSINESS_INFO_API}/${account.name}/locations`);
      url.searchParams.set("readMask", "name,title,phoneNumbers,storefrontAddress,websiteUri,metadata");
      url.searchParams.set("pageSize", "100");
      if (locationPageToken) url.searchParams.set("pageToken", locationPageToken);
      const response = await googleFetch(url.toString(), { headers: authHeaders(accessToken) }, fetcher, "LOCATIONS_LIST");
      const data = await parsedResponse(response, locationsResponseSchema, "LOCATIONS_LIST");
      for (const location of data.locations ?? []) {
        if (!/^locations\/[^/]+$/.test(location.name)) continue;
        locations.push({
          resourceName: `${account.name}/${location.name}`,
          accountName: account.name,
          locationName: location.name,
          title: location.title,
          phone: location.phoneNumbers?.primaryPhone ?? null,
          address: displayAddress(location.storefrontAddress),
          websiteUrl: location.websiteUri ?? null,
          mapsUrl: location.metadata?.mapsUri ?? null,
          writeReviewUrl: location.metadata?.newReviewUri ?? null,
        });
        if (locations.length >= 100) break;
      }
      if (!data.nextPageToken || locations.length >= 100) break;
      locationPageToken = data.nextPageToken;
    }
    if (locations.length >= 100) break;
  }
  return locations;
}

const starValues = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 } as const;

function safeDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function listGoogleBusinessReviews(accessToken: string, parent: string, fetcher: typeof fetch = fetch) {
  if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(parent)) {
    throw new GoogleBusinessProfileError("LOCATION_RESOURCE_INVALID", 400);
  }
  const url = new URL(`${REVIEWS_API}/${parent}/reviews`);
  url.searchParams.set("pageSize", "50");
  url.searchParams.set("orderBy", "updateTime desc");
  const response = await googleFetch(url.toString(), { headers: authHeaders(accessToken) }, fetcher, "REVIEWS_LIST");
  const data = await parsedResponse(response, reviewsResponseSchema, "REVIEWS_LIST");
  const reviews: GoogleBusinessReview[] = (data.reviews ?? []).map((review) => ({
    sourceReviewId: review.reviewId ?? null,
    authorDisplayName: review.reviewer?.isAnonymous ? "Anonim Google kullanıcısı" : review.reviewer?.displayName || "Google kullanıcısı",
    rating: starValues[review.starRating],
    text: review.comment ?? null,
    clinicResponse: review.reviewReply?.comment ?? null,
    publishedAt: safeDate(review.createTime ?? review.updateTime),
  }));
  return {
    reviews,
    rating: data.averageRating ?? null,
    reviewCount: data.totalReviewCount ?? reviews.length,
  };
}

export async function revokeGoogleBusinessToken(token: string, fetcher: typeof fetch = fetch) {
  const body = new URLSearchParams({ token });
  try {
    const response = await fetcher(REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export { BUSINESS_SCOPE };
