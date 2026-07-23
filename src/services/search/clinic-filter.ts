import type { Clinic, ClinicSearchFilters } from "@/domain/types";

function clinicLowestPrice(clinic: Clinic) {
  const prices = clinic.prices.flatMap((price) => [
    price.fixedPrice,
    price.minPrice,
    price.maxPrice,
  ]).filter((value): value is number => typeof value === "number");

  return Math.min(...prices);
}

function liveGoogleRating(clinic: Clinic) {
  return clinic.google.isDemoData ? null : clinic.google.rating;
}

function liveGoogleReviewCount(clinic: Clinic) {
  return clinic.google.isDemoData ? null : clinic.google.reviewCount;
}

export function filterClinics(clinics: Clinic[], filters: ClinicSearchFilters) {
  const query = filters.q?.toLocaleLowerCase("tr-TR");
  const treatment = filters.treatment?.toLocaleLowerCase("tr-TR");

  const filtered = clinics.filter((clinic) => {
    const searchable = [
      clinic.name,
      clinic.city,
      clinic.district,
      clinic.neighborhood,
      ...clinic.specialties,
      ...clinic.treatments,
      ...clinic.doctors.map((doctor) => doctor.fullName),
    ].join(" ").toLocaleLowerCase("tr-TR");

    if (query && !searchable.includes(query)) return false;
    if (filters.city && clinic.city !== filters.city) return false;
    if (filters.district && clinic.district !== filters.district) return false;
    if (treatment && !clinic.treatments.some((item) => item.toLocaleLowerCase("tr-TR").includes(treatment))) return false;
    if (filters.minGoogleRating && (liveGoogleRating(clinic) ?? 0) < filters.minGoogleRating) return false;
    if (filters.minGoogleReviews && (liveGoogleReviewCount(clinic) ?? 0) < filters.minGoogleReviews) return false;
    if (filters.verifiedOnly && !clinic.verified) return false;
    if (filters.openNow && !clinic.openNow) return false;
    if (filters.freeInitialExam && !clinic.freeInitialExam) return false;
    if (typeof filters.maxExamFee === "number" && (clinic.firstExamFee === null || clinic.firstExamFee > filters.maxExamFee)) return false;

    if (filters.minPrice || filters.maxPrice) {
      const hasMatchingPrice = clinic.prices.some((price) => {
        const low = price.fixedPrice ?? price.minPrice ?? 0;
        const high = price.fixedPrice ?? price.maxPrice ?? low;
        if (filters.minPrice && high < filters.minPrice) return false;
        if (filters.maxPrice && low > filters.maxPrice) return false;
        return true;
      });
      if (!hasMatchingPrice) return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (a.sponsored !== b.sponsored) return Number(b.sponsored) - Number(a.sponsored);
    switch (filters.sort) {
      case "nearest":
        return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      case "rating":
        return (liveGoogleRating(b) ?? 0) - (liveGoogleRating(a) ?? 0);
      case "reviews":
        return (liveGoogleReviewCount(b) ?? 0) - (liveGoogleReviewCount(a) ?? 0);
      case "lowest-price":
        return clinicLowestPrice(a) - clinicLowestPrice(b);
      case "soonest":
        return (a.nextAvailableAt ? new Date(a.nextAvailableAt).getTime() : Number.POSITIVE_INFINITY)
          - (b.nextAvailableAt ? new Date(b.nextAvailableAt).getTime() : Number.POSITIVE_INFINITY);
      default:
        return Number(b.verified) - Number(a.verified) || (liveGoogleRating(b) ?? 0) - (liveGoogleRating(a) ?? 0);
    }
  });
}
