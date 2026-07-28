import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleBusinessAuthorizationUrl,
  decryptGoogleRefreshToken,
  encryptGoogleRefreshToken,
  listGoogleBusinessLocations,
  listGoogleBusinessReviews,
  type GoogleBusinessConfig,
} from "@/services/google/business-profile";

const key = Buffer.alloc(32, 7);
const config: GoogleBusinessConfig = {
  clientId: "client-id.apps.googleusercontent.com",
  clientSecret: "server-secret",
  encryptionKey: key,
  redirectUri: "https://discibul.example/api/clinic/google-business/callback",
};

describe("Google Business Profile OAuth security", () => {
  it("encrypts refresh tokens with clinic-bound authenticated encryption", () => {
    const encrypted = encryptGoogleRefreshToken("refresh-token", "clinic-1", key);
    expect(encrypted).not.toContain("refresh-token");
    expect(decryptGoogleRefreshToken(encrypted, "clinic-1", key)).toBe("refresh-token");
    expect(() => decryptGoogleRefreshToken(encrypted, "clinic-2", key)).toThrow("OAUTH_TOKEN_INVALID");
    const parts = encrypted.split(".");
    const ciphertext = Buffer.from(parts[2]!, "base64url");
    ciphertext[0] = ciphertext[0]! ^ 1;
    parts[2] = ciphertext.toString("base64url");
    expect(() => decryptGoogleRefreshToken(parts.join("."), "clinic-1", key)).toThrow("OAUTH_TOKEN_INVALID");
  });

  it("builds an offline consent flow with exact state and callback", () => {
    const url = buildGoogleBusinessAuthorizationUrl(config, "opaque-state");
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("scope")).toBe("https://www.googleapis.com/auth/business.manage");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toContain("consent");
    expect(url.searchParams.get("state")).toBe("opaque-state");
    expect(url.searchParams.get("redirect_uri")).toBe(config.redirectUri);
  });

  it("rejects an insecure production callback even when strict runtime checks are disabled", async () => {
    const { getGoogleBusinessConfig } = await import("@/services/google/business-profile");
    expect(getGoogleBusinessConfig({
      NODE_ENV: "production",
      APP_BASE_URL: "http://discibul.example",
      GOOGLE_BUSINESS_CLIENT_ID: "client-id",
      GOOGLE_BUSINESS_CLIENT_SECRET: "secret",
      GOOGLE_BUSINESS_TOKEN_ENCRYPTION_KEY: key.toString("base64"),
    })).toBeNull();
  });
});

describe("Google Business Profile data mapping", () => {
  it("lists only authorized account locations with contact and source links", async () => {
    const fetcher = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer access-token");
      if (url.includes("accountmanagement")) {
        return Response.json({ accounts: [{ name: "accounts/123", accountName: "DişçiBul Test" }] });
      }
      return Response.json({ locations: [{
        name: "locations/456",
        title: "Kadıköy Ağız ve Diş Sağlığı Kliniği",
        phoneNumbers: { primaryPhone: "+90 216 000 00 00" },
        storefrontAddress: { addressLines: ["Test Sokak 1"], locality: "Kadıköy", administrativeArea: "İstanbul" },
        websiteUri: "https://clinic.example",
        metadata: {
          mapsUri: "https://maps.google.com/?cid=123",
          newReviewUri: "https://search.google.com/local/writereview?placeid=123",
        },
      }] });
    });

    const locations = await listGoogleBusinessLocations("access-token", fetcher as typeof fetch);
    expect(locations).toEqual([expect.objectContaining({
      resourceName: "accounts/123/locations/456",
      title: "Kadıköy Ağız ve Diş Sağlığı Kliniği",
      phone: "+90 216 000 00 00",
      address: "Test Sokak 1, Kadıköy, İstanbul",
      mapsUrl: "https://maps.google.com/?cid=123",
    })]);
  });

  it("maps rating totals, reviews and clinic replies without inventing text", async () => {
    const fetcher = vi.fn(async () => Response.json({
      averageRating: 4.7,
      totalReviewCount: 128,
      reviews: [{
        reviewId: "review-1",
        reviewer: { displayName: "Ayşe K." },
        starRating: "FIVE",
        comment: "İlgili ve açıklayıcı bir ekipti.",
        createTime: "2026-07-10T10:00:00Z",
        reviewReply: { comment: "Geri bildiriminiz için teşekkür ederiz." },
      }, {
        reviewId: "review-2",
        reviewer: { isAnonymous: true },
        starRating: "FOUR",
      }],
    }));

    const result = await listGoogleBusinessReviews("access-token", "accounts/123/locations/456", fetcher as typeof fetch);
    expect(result).toMatchObject({ rating: 4.7, reviewCount: 128 });
    expect(result.reviews[0]).toMatchObject({
      authorDisplayName: "Ayşe K.",
      rating: 5,
      text: "İlgili ve açıklayıcı bir ekipti.",
      clinicResponse: "Geri bildiriminiz için teşekkür ederiz.",
    });
    expect(result.reviews[1]).toMatchObject({ authorDisplayName: "Anonim Google kullanıcısı", rating: 4, text: null });
  });

  it("rejects a forged location resource before making a request", async () => {
    const fetcher = vi.fn();
    await expect(listGoogleBusinessReviews("access-token", "accounts/123/locations/456/reviews/forged", fetcher as typeof fetch)).rejects.toThrow("LOCATION_RESOURCE_INVALID");
    expect(fetcher).not.toHaveBeenCalled();
  });
});
