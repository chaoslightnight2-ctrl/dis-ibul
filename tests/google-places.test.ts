import { describe, expect, it, vi } from "vitest";
import { clinicSearchSchema } from "@/domain/validation";
import { GooglePlacesApiClient, mapGooglePlace } from "@/services/google/places";
import { filterGooglePlaces } from "@/services/search/google-place-filter";

const googlePlace = {
  id: "ChIJ-test-place_1",
  displayName: { text: "Kadıköy Ağız ve Diş Kliniği", languageCode: "tr" },
  formattedAddress: "Caferağa, Kadıköy/İstanbul",
  addressComponents: [
    { longText: "İstanbul", types: ["administrative_area_level_1"] },
    { longText: "Kadıköy", types: ["administrative_area_level_2"] },
  ],
  rating: 4.8,
  userRatingCount: 324,
  googleMapsLinks: {
    placeUri: "https://maps.google.com/?cid=1",
    reviewsUri: "https://maps.google.com/reviews/1",
    writeAReviewUri: "https://search.google.com/local/writereview?placeid=ChIJ-test-place_1",
  },
  currentOpeningHours: { openNow: true, weekdayDescriptions: ["Pazartesi: 09:00-18:00"] },
  websiteUri: "https://example-dental.test",
  nationalPhoneNumber: "0212 000 00 00",
  businessStatus: "OPERATIONAL",
  reviews: [{
    name: "places/ChIJ-test-place_1/reviews/abc",
    relativePublishTimeDescription: "2 hafta önce",
    text: { text: "Çok ilgili bir ekipti.", languageCode: "tr" },
    originalText: { text: "A very attentive team.", languageCode: "en" },
    rating: 5,
    authorAttribution: {
      displayName: "Ayşe K.",
      uri: "https://www.google.com/maps/contrib/1",
      photoUri: "https://lh3.googleusercontent.com/a/test",
    },
    publishTime: "2026-07-01T10:00:00Z",
    flagContentUri: "https://www.google.com/local/content/report/1",
    googleMapsUri: "https://www.google.com/maps/reviews/data=1",
    visitDate: { year: 2026, month: 6 },
  }],
};

describe("Google Places mapping", () => {
  it("keeps source links, author attribution and translation metadata", () => {
    const mapped = mapGooglePlace(googlePlace);
    expect(mapped).toMatchObject({
      placeId: "ChIJ-test-place_1",
      city: "İstanbul",
      district: "Kadıköy",
      rating: 4.8,
      reviewCount: 324,
      openNow: true,
    });
    expect(mapped.reviews[0]).toMatchObject({
      authorName: "Ayşe K.",
      translated: true,
      visitDate: "2026-06",
      rating: 5,
    });
    expect(mapped.reviews[0].googleMapsUri).toContain("google.com/maps/reviews");
    expect(mapped.reviews[0].flagContentUri).toContain("google.com/local/content/report");
  });

  it("requests a narrow field mask and no-store search response", async () => {
    const fetcher = vi.fn(async (...args: [string | URL, RequestInit?]) => {
      void args;
      return new Response(JSON.stringify({ places: [googlePlace] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const client = new GooglePlacesApiClient("server-only-key", fetcher, false);
    const results = await client.searchDentalClinics({ city: "İstanbul", district: "Kadıköy", minGoogleRating: 4.2, openNow: true });

    expect(results).toHaveLength(1);
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:searchText");
    expect(init?.cache).toBe("no-store");
    expect(new Headers(init?.headers).get("X-Goog-Api-Key")).toBe("server-only-key");
    expect(new Headers(init?.headers).get("X-Goog-FieldMask")).toContain("places.userRatingCount");
    expect(JSON.parse(String(init?.body))).toMatchObject({
      textQuery: "diş kliniği Kadıköy İstanbul Türkiye",
      minRating: 4.5,
      openNow: true,
      includedType: "dental_clinic",
    });
  });
});

describe("Google clinic filters", () => {
  const mapped = mapGooglePlace(googlePlace);

  it("filters by city, district, rating and review count", () => {
    expect(filterGooglePlaces([mapped], { city: "İstanbul", district: "Kadıköy", minGoogleRating: 4.5, minGoogleReviews: 300 })).toHaveLength(1);
    expect(filterGooglePlaces([mapped], { minGoogleReviews: 500 })).toHaveLength(0);
  });

  it("does not present unknown Google clinics as price-filtered DişçiBul clinics", () => {
    expect(filterGooglePlaces([mapped], { maxPrice: 20_000 })).toHaveLength(0);
    expect(filterGooglePlaces([mapped], { verifiedOnly: true })).toHaveLength(0);
  });

  it("parses source and review filters with safe defaults", () => {
    expect(clinicSearchSchema.parse({}).source).toBe("all");
    expect(clinicSearchSchema.parse({ source: "google", minGoogleReviews: "100" })).toMatchObject({ source: "internet", minGoogleReviews: 100 });
    expect(clinicSearchSchema.parse({ source: "internet" }).source).toBe("internet");
    expect(clinicSearchSchema.safeParse({ source: "scraper" }).success).toBe(false);
  });
});
