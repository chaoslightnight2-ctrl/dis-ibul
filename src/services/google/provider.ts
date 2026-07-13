import { findClinicBySlug } from "@/data/clinics";
import type { GoogleSummary } from "@/domain/types";

export type GoogleProvider = {
  getPlaceSummary(clinicSlug: string): Promise<GoogleSummary | null>;
  getWriteReviewUrl(clinicSlug: string): Promise<string | null>;
};

export class MockGoogleProvider implements GoogleProvider {
  async getPlaceSummary(clinicSlug: string) {
    return findClinicBySlug(clinicSlug)?.google ?? null;
  }

  async getWriteReviewUrl(clinicSlug: string) {
    return findClinicBySlug(clinicSlug)?.google.writeReviewUrl ?? null;
  }
}

export function getGoogleProvider(): GoogleProvider {
  return new MockGoogleProvider();
}
