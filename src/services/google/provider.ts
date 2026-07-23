import type { GoogleSummary } from "@/domain/types";
import { getPublishedClinicBySlug } from "@/services/clinics/public-clinics";

export type GoogleProvider = {
  getPlaceSummary(clinicSlug: string): Promise<GoogleSummary | null>;
  getWriteReviewUrl(clinicSlug: string): Promise<string | null>;
};

export class DatabaseGoogleProvider implements GoogleProvider {
  async getPlaceSummary(clinicSlug: string) {
    return (await getPublishedClinicBySlug(clinicSlug))?.google ?? null;
  }

  async getWriteReviewUrl(clinicSlug: string) {
    const google = (await getPublishedClinicBySlug(clinicSlug))?.google;
    return google?.writeReviewUrl || null;
  }
}

export function getGoogleProvider(): GoogleProvider {
  return new DatabaseGoogleProvider();
}
