import type { Clinic, ClinicSearchFilters, GooglePlaceSearchResult, OpenStreetMapClinic } from "@/domain/types";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getPublishedClinics } from "@/services/clinics/public-clinics";
import { getGooglePlacesClient, GooglePlacesError, isGooglePlacesConfigured } from "@/services/google/places";
import { getOsmClinicClient, OsmClinicError } from "@/services/osm/clinics";
import { filterClinics } from "@/services/search/clinic-filter";
import { filterGooglePlaces } from "@/services/search/google-place-filter";
import { filterOsmClinics } from "@/services/search/osm-clinic-filter";

export type ExternalSearchStatus = "ok" | "needs_location" | "location_not_found" | "rate_limited" | "unavailable" | "skipped";
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
  return value?.trim().toLocaleLowerCase("tr-TR").replace(/[^a-z0-9çğıöşü]+/g, " ").trim() ?? "";
}

function registeredClinicKey(clinic: Clinic) {
  return `${normalize(clinic.name)}|${normalize(clinic.city)}|${normalize(clinic.district)}`;
}

function osmClinicKey(clinic: OpenStreetMapClinic) {
  return `${normalize(clinic.name)}|${normalize(clinic.city)}|${normalize(clinic.district)}`;
}

function googleClinicKey(clinic: GooglePlaceSearchResult) {
  return `${normalize(clinic.name)}|${normalize(clinic.city)}|${normalize(clinic.district)}`;
}

function mergeLiveGoogleData(clinics: Clinic[], places: GooglePlaceSearchResult[]) {
  const byPlaceId = new Map(places.map((place) => [place.placeId, place]));
  return clinics.map((clinic) => {
    const place = clinic.google.placeId ? byPlaceId.get(clinic.google.placeId) : null;
    if (!place) return clinic;
    return {
      ...clinic,
      google: {
        ...clinic.google,
        rating: place.rating,
        reviewCount: place.reviewCount,
        mapsUrl: place.mapsUrl,
        writeReviewUrl: place.writeReviewUrl ?? clinic.google.writeReviewUrl,
        lastSyncedAt: new Date().toISOString(),
        syncStatus: "OK" as const,
        isDemoData: false,
      },
    };
  });
}

export async function searchClinics(filters: ClinicSearchFilters): Promise<ClinicSearchResult> {
  const publishedClinics = await getPublishedClinics();
  const source = filters.source ?? "all";
  let registeredClinics = source === "internet" ? [] : filterClinics(publishedClinics, filters);
  const emptyExternal = {
    googlePlaces: [] as GooglePlaceSearchResult[],
    osmClinics: [] as OpenStreetMapClinic[],
    externalProvider: null as "google" | "osm" | null,
  };

  if (source === "discibul") {
    return { registeredClinics, ...emptyExternal, externalStatus: "skipped", googleStatus: "skipped" };
  }
  if (!filters.city?.trim()) {
    return { registeredClinics, ...emptyExternal, externalStatus: "needs_location", googleStatus: "skipped" };
  }
  if (!isTurkeyCity(filters.city)) {
    return { registeredClinics, ...emptyExternal, externalStatus: "location_not_found", googleStatus: "skipped" };
  }

  let googleStatus: GoogleSearchStatus = isGooglePlacesConfigured() ? "unavailable" : "not_configured";
  if (isGooglePlacesConfigured()) {
    try {
      const rawPlaces = await getGooglePlacesClient().searchDentalClinics(filters);
      const registeredPlaceIds = new Set(publishedClinics.map((clinic) => clinic.google.placeId).filter(Boolean));
      const registeredKeys = new Set(publishedClinics.map(registeredClinicKey));
      const externalPlaces = rawPlaces.filter((place) => !registeredPlaceIds.has(place.placeId) && !registeredKeys.has(googleClinicKey(place)));
      registeredClinics = source === "internet" ? [] : filterClinics(mergeLiveGoogleData(publishedClinics, rawPlaces), filters);
      return {
        registeredClinics,
        googlePlaces: filterGooglePlaces(externalPlaces, filters),
        osmClinics: [],
        externalProvider: "google",
        externalStatus: "ok",
        googleStatus: "ok",
      };
    } catch (error) {
      googleStatus = error instanceof GooglePlacesError && error.code === "RATE_LIMITED" ? "rate_limited" : "unavailable";
    }
  }

  try {
    const rawClinics = await getOsmClinicClient().searchDentalClinics(filters);
    const registeredKeys = new Set(publishedClinics.map(registeredClinicKey));
    const externalClinics = rawClinics.filter((clinic) => !registeredKeys.has(osmClinicKey(clinic)));
    return {
      registeredClinics,
      googlePlaces: [],
      osmClinics: filterOsmClinics(externalClinics, filters),
      externalProvider: "osm",
      externalStatus: "ok",
      googleStatus,
    };
  } catch (error) {
    const externalStatus = error instanceof OsmClinicError
      ? error.code === "RATE_LIMITED"
        ? "rate_limited"
        : error.code === "LOCATION_NOT_FOUND"
          ? "location_not_found"
          : "unavailable"
      : "unavailable";
    return { registeredClinics, ...emptyExternal, externalStatus, googleStatus };
  }
}
