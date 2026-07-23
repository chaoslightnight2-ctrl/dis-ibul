import type { ClinicSearchFilters, OpenStreetMapClinic } from "@/domain/types";

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function hasRegisteredOnlyFilters(filters: ClinicSearchFilters) {
  return Boolean(
    filters.verifiedOnly
    || filters.freeInitialExam
    || filters.openNow
    || typeof filters.maxExamFee === "number"
    || typeof filters.minPrice === "number"
    || typeof filters.maxPrice === "number"
    || typeof filters.minGoogleRating === "number"
    || typeof filters.minGoogleReviews === "number",
  );
}

function matchesText(clinic: OpenStreetMapClinic, filters: ClinicSearchFilters) {
  const search = normalize([filters.q, filters.treatment].filter(Boolean).join(" "));
  if (!search) return true;
  const haystack = normalize([clinic.name, clinic.formattedAddress, ...clinic.specialties].join(" "));
  const aliases: Record<string, string> = {
    implant: "implantoloji",
    ortodonti: "orthodontics ortodonti",
    kanal: "endodonti endodontics",
    çocuk: "pediatric çocuk",
  };
  return search.split(/\s+/).every((token) => haystack.includes(token) || haystack.includes(aliases[token] ?? "\u0000"));
}

export function filterOsmClinics(clinics: OpenStreetMapClinic[], filters: ClinicSearchFilters) {
  if (hasRegisteredOnlyFilters(filters)) return [];
  return clinics
    .filter((clinic) => matchesText(clinic, filters))
    .sort((a, b) => a.name.localeCompare(b.name, "tr-TR"));
}
