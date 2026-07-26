import type { Clinic, ClinicSearchFilters, GooglePlaceSearchResult, OpenStreetMapClinic } from "@/domain/types";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getPublishedClinics } from "@/services/clinics/public-clinics";
import { getGooglePlacesClient, GooglePlacesError, isGooglePlacesConfigured } from "@/services/google/places";
import { searchOsmClinicIndex, upsertOsmClinicIndex } from "@/services/osm/clinic-index";
import { getOsmClinicClient, OsmClinicError } from "@/services/osm/clinics";
import { filterOsmClinics } from "@/services/search/osm-clinic-filter";

export type ExternalSearchStatus = "ok" | "location_not_found" | "rate_limited" | "unavailable" | "skipped";
export type GoogleSearchStatus = "ok" | "not_configured" | "rate_limited" | "unavailable" | "skipped";

export type ClinicSearchResult = {
  registeredClinics: Clinic[];
  googlePlaces: GooglePlaceSearchResult[];
  osmClinics: OpenStreetMapClinic[];
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

function dedupeOsmClinics(clinics: OpenStreetMapClinic[]) {
  const unique = new Map<string, OpenStreetMapClinic>();
  for (const clinic of clinics) {
    unique.set(`${clinic.osmType}/${clinic.osmId}`, clinic);
  }
  return [...unique.values()];
}

export async function searchClinics(filters: ClinicSearchFilters): Promise<ClinicSearchResult> {
  const emptyExternal = {
    googlePlaces: [] as GooglePlaceSearchResult[],
    osmClinics: [] as OpenStreetMapClinic[],
    externalProvider: null as "google" | "osm" | null,
  };

  if (!isTurkeyCity(filters.city) && filters.city?.trim()) {
    return { registeredClinics: [], ...emptyExternal, externalStatus: "location_not_found", googleStatus: "skipped" };
  }

  // Her iki kaynağı da paralel çek — Google varsa yıldız gösterir, OSM daha fazla klinik bulur
  const [registeredClinics, googlePlaces, indexedClinics, osmRaw] = await Promise.all([
    getPublishedClinics()
      .then((clinics) => filterPublishedClinics(clinics, filters))
      .catch(() => [] as Clinic[]),
    (async (): Promise<{ status: GoogleSearchStatus; places: GooglePlaceSearchResult[] }> => {
      if (!isGooglePlacesConfigured()) return { status: "not_configured", places: [] };
      try {
        const places = await getGooglePlacesClient().searchDentalClinics(filters);
        return { status: "ok", places };
      } catch (error) {
        const status = error instanceof GooglePlacesError && error.code === "RATE_LIMITED" ? "rate_limited" : "unavailable";
        return { status, places: [] };
      }
    })(),
    searchOsmClinicIndex(filters),
    (async (): Promise<{ status: ExternalSearchStatus; clinics: OpenStreetMapClinic[] }> => {
      try {
        const clinics = await getOsmClinicClient().searchDentalClinics(filters);
        return { status: "ok", clinics: filterOsmClinics(clinics, filters) };
      } catch (error) {
        const status = error instanceof OsmClinicError
          ? error.code === "RATE_LIMITED"
            ? "rate_limited"
            : error.code === "LOCATION_NOT_FOUND"
              ? "location_not_found"
              : "unavailable"
          : "unavailable";
        return { status, clinics: [] };
      }
    })(),
  ]);
  if (osmRaw.clinics.length) {
    await upsertOsmClinicIndex(osmRaw.clinics, "openstreetmap-live").catch(() => null);
  }
  const osmClinics = dedupeOsmClinics([...indexedClinics, ...osmRaw.clinics]);

  return {
    registeredClinics,
    googlePlaces: googlePlaces.places,
    osmClinics,
    externalProvider: googlePlaces.places.length ? "google" : osmClinics.length ? "osm" : null,
    externalStatus: osmClinics.length ? "ok" : osmRaw.status,
    googleStatus: googlePlaces.status,
  };
}
