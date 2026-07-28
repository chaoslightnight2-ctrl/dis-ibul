import type { Clinic, ClinicSearchFilters, GooglePlaceSearchResult, OpenStreetMapClinic, PublicDirectoryClinic } from "@/domain/types";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getPublishedClinics } from "@/services/clinics/public-clinics";
import { searchPublicClinicDirectory } from "@/services/directory/clinic-directory";
import { searchOsmClinicIndex } from "@/services/osm/clinic-index";

export type ExternalSearchStatus = "ok" | "location_not_found" | "rate_limited" | "unavailable" | "skipped";
export type GoogleSearchStatus = "ok" | "not_configured" | "rate_limited" | "unavailable" | "skipped";

export type ClinicSearchResult = {
  registeredClinics: Clinic[];
  googlePlaces: GooglePlaceSearchResult[];
  osmClinics: OpenStreetMapClinic[];
  directoryClinics: PublicDirectoryClinic[];
  externalProvider: "google" | "osm" | null;
  externalStatus: ExternalSearchStatus;
  googleStatus: GoogleSearchStatus;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function filterPublishedClinics(clinics: Clinic[], filters: ClinicSearchFilters) {
  const query = normalize(filters.q);
  const treatment = normalize(filters.treatment);
  const city = normalize(filters.city);
  const district = normalize(filters.district);

  return clinics.filter((clinic) => {
    if (city && normalize(clinic.city) !== city) return false;
    if (district && normalize(clinic.district) !== district) return false;
    if (typeof filters.minGoogleRating === "number" && (clinic.google.rating ?? 0) < filters.minGoogleRating) return false;
    if (typeof filters.minGoogleReviews === "number" && (clinic.google.reviewCount ?? 0) < filters.minGoogleReviews) return false;

    const searchable = [
      clinic.name,
      clinic.description,
      clinic.city,
      clinic.district,
      clinic.neighborhood,
      clinic.address,
      ...clinic.specialties,
      ...clinic.treatments,
      ...clinic.prices.map((price) => price.treatmentName),
      ...clinic.doctors.map((doctor) => doctor.fullName),
    ].map(normalize);

    if (query && !searchable.some((value) => value.includes(query))) return false;
    if (treatment && !searchable.some((value) => value.includes(treatment))) return false;
    return true;
  });
}

export async function searchClinics(filters: ClinicSearchFilters): Promise<ClinicSearchResult> {
  const emptyExternal = {
    googlePlaces: [] as GooglePlaceSearchResult[],
    osmClinics: [] as OpenStreetMapClinic[],
    directoryClinics: [] as PublicDirectoryClinic[],
    externalProvider: null as "google" | "osm" | null,
  };

  if (!isTurkeyCity(filters.city) && filters.city?.trim()) {
    return { registeredClinics: [], ...emptyExternal, externalStatus: "location_not_found", googleStatus: "skipped" };
  }

  // Public searches are database-only. External providers are reserved for
  // explicit, protected import/sync jobs.
  const [registeredClinics, indexedClinics, directoryClinics] = await Promise.all([
    getPublishedClinics()
      .then((clinics) => filterPublishedClinics(clinics, filters))
      .catch(() => [] as Clinic[]),
    searchOsmClinicIndex(filters),
    searchPublicClinicDirectory(filters),
  ]);

  return {
    registeredClinics,
    googlePlaces: [],
    osmClinics: indexedClinics,
    directoryClinics,
    externalProvider: indexedClinics.length || directoryClinics.length ? "osm" : null,
    externalStatus: indexedClinics.length || directoryClinics.length ? "ok" : "unavailable",
    googleStatus: "skipped",
  };
}
