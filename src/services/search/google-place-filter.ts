import type { ClinicSearchFilters, GooglePlaceSearchResult } from "@/domain/types";

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function sameLocation(expected: string | undefined, actual: string | null) {
  if (!expected) return true;
  const wanted = normalize(expected);
  const received = normalize(actual);
  return received === wanted || received.includes(wanted) || wanted.includes(received);
}

function hasRegisteredOnlyFilters(filters: ClinicSearchFilters) {
  return Boolean(
    filters.verifiedOnly
    || filters.freeInitialExam
    || typeof filters.maxExamFee === "number"
    || typeof filters.minPrice === "number"
    || typeof filters.maxPrice === "number",
  );
}

export function filterGooglePlaces(places: GooglePlaceSearchResult[], filters: ClinicSearchFilters) {
  if (hasRegisteredOnlyFilters(filters)) return [];
  const filtered = places.filter((place) => {
    if (!sameLocation(filters.city, place.city)) return false;
    if (!sameLocation(filters.district, place.district)) return false;
    if (typeof filters.minGoogleRating === "number" && (place.rating ?? 0) < filters.minGoogleRating) return false;
    if (typeof filters.minGoogleReviews === "number" && place.reviewCount < filters.minGoogleReviews) return false;
    if (filters.openNow && place.openNow !== true) return false;
    if (place.businessStatus === "CLOSED_PERMANENTLY") return false;
    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.sort === "rating") return (b.rating ?? 0) - (a.rating ?? 0) || b.reviewCount - a.reviewCount;
    if (filters.sort === "reviews") return b.reviewCount - a.reviewCount || (b.rating ?? 0) - (a.rating ?? 0);
    return 0;
  });
}
