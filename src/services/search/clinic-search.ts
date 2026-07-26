import type { ClinicSearchFilters, GooglePlaceSearchResult, OpenStreetMapClinic } from "@/domain/types";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getGooglePlacesClient, GooglePlacesError, isGooglePlacesConfigured } from "@/services/google/places";
import { getOsmClinicClient, OsmClinicError } from "@/services/osm/clinics";
import { filterOsmClinics } from "@/services/search/osm-clinic-filter";

export type ExternalSearchStatus = "ok" | "location_not_found" | "rate_limited" | "unavailable" | "skipped";
export type GoogleSearchStatus = "ok" | "not_configured" | "rate_limited" | "unavailable" | "skipped";

export type ClinicSearchResult = {
  registeredClinics: [];
  googlePlaces: GooglePlaceSearchResult[];
  osmClinics: OpenStreetMapClinic[];
  externalProvider: "google" | "osm" | null;
  externalStatus: ExternalSearchStatus;
  googleStatus: GoogleSearchStatus;
};

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
  const [googlePlaces, osmRaw] = await Promise.all([
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

  return {
    registeredClinics: [],
    googlePlaces: googlePlaces.places,
    osmClinics: osmRaw.clinics,
    externalProvider: googlePlaces.places.length ? "google" : osmRaw.clinics.length ? "osm" : null,
    externalStatus: osmRaw.status,
    googleStatus: googlePlaces.status,
  };
}
