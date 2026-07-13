export type UserRole =
  | "VISITOR"
  | "PATIENT"
  | "DENTIST"
  | "CLINIC_MANAGER"
  | "MODERATOR"
  | "SUPER_ADMIN";

export type VerificationStatus =
  | "DRAFT"
  | "PENDING_SUBMISSION"
  | "IN_REVIEW"
  | "ADDITIONAL_DOCUMENT_REQUIRED"
  | "VERIFIED"
  | "REJECTED"
  | "SUSPENDED";

export type ClinicPrice = {
  treatmentSlug: string;
  treatmentName: string;
  minPrice?: number;
  maxPrice?: number;
  fixedPrice?: number;
  currency: "TRY" | "EUR" | "USD";
  unit: string;
  updatedAt: string;
  includes: string[];
  extraFeeConditions: string;
};

export type GoogleSummary = {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
  mapsUrl: string;
  writeReviewUrl: string;
  lastSyncedAt: string | null;
  syncStatus: "OK" | "FAILED" | "NEVER_SYNCED";
  isDemoData: boolean;
};

export type Dentist = {
  slug: string;
  fullName: string;
  title: string;
  specialties: string[];
  experienceYears: number;
  languages: string[];
  about: string;
  verified: boolean;
};

export type Clinic = {
  slug: string;
  name: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  distanceKm: number;
  verified: boolean;
  sponsored: boolean;
  emergencyService: boolean;
  openNow: boolean;
  wheelchairAccess: boolean;
  parking: boolean;
  onlineConsultation: boolean;
  childFriendly: boolean;
  sedation: boolean;
  languages: string[];
  specialties: string[];
  treatments: string[];
  doctors: Dentist[];
  prices: ClinicPrice[];
  google: GoogleSummary;
  nextAvailableAt: string;
  responseTimeHours: number;
};

export type ClinicSearchFilters = {
  q?: string;
  city?: string;
  district?: string;
  treatment?: string;
  minPrice?: number;
  maxPrice?: number;
  minGoogleRating?: number;
  verifiedOnly?: boolean;
  openNow?: boolean;
  sort?: "recommended" | "nearest" | "rating" | "reviews" | "lowest-price" | "soonest";
};
