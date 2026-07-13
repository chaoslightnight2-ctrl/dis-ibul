import { clinics } from "@/data/clinics";
import type { Clinic, ClinicSearchFilters } from "@/domain/types";

function clinicLowestPrice(clinic: Clinic) {
  const prices = clinic.prices.flatMap((price) => [
    price.fixedPrice,
    price.minPrice,
    price.maxPrice,
  ]).filter((value): value is number => typeof value === "number");

  return Math.min(...prices);
}

export function searchClinics(filters: ClinicSearchFilters) {
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
    if (filters.minGoogleRating && (clinic.google.rating ?? 0) < filters.minGoogleRating) return false;
    if (filters.verifiedOnly && !clinic.verified) return false;
    if (filters.openNow && !clinic.openNow) return false;

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
        return a.distanceKm - b.distanceKm;
      case "rating":
        return (b.google.rating ?? 0) - (a.google.rating ?? 0);
      case "reviews":
        return (b.google.reviewCount ?? 0) - (a.google.reviewCount ?? 0);
      case "lowest-price":
        return clinicLowestPrice(a) - clinicLowestPrice(b);
      case "soonest":
        return new Date(a.nextAvailableAt).getTime() - new Date(b.nextAvailableAt).getTime();
      default:
        return Number(b.verified) - Number(a.verified) || (b.google.rating ?? 0) - (a.google.rating ?? 0);
    }
  });
}
