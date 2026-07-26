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
  syncStatus: "OK" | "FAILED" | "RATE_LIMITED" | "NEVER_SYNCED";
  isDemoData: boolean;
  reviews?: GoogleCachedReview[];
};

export type GoogleCachedReview = {
  id: string;
  authorName: string;
  rating: number;
  text: string | null;
  clinicResponse: string | null;
  sourceUrl: string | null;
  publishedAt: string | null;
};

export type GooglePlaceReview = {
  id: string;
  authorName: string;
  authorUri: string | null;
  authorPhotoUri: string | null;
  rating: number;
  text: string | null;
  originalText: string | null;
  translated: boolean;
  relativePublishTime: string | null;
  publishTime: string | null;
  googleMapsUri: string;
  flagContentUri: string | null;
  visitDate: string | null;
};

export type GooglePlaceSearchResult = {
  placeId: string;
  name: string;
  formattedAddress: string;
  city: string | null;
  district: string | null;
  rating: number | null;
  reviewCount: number;
  openNow: boolean | null;
  businessStatus: "OPERATIONAL" | "CLOSED_TEMPORARILY" | "CLOSED_PERMANENTLY" | "FUTURE_OPENING" | "UNKNOWN";
  mapsUrl: string;
  reviewsUrl: string | null;
  writeReviewUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
};

export type GooglePlaceDetails = GooglePlaceSearchResult & {
  weekdayDescriptions: string[];
  reviews: GooglePlaceReview[];
};

export type OpenStreetMapClinic = {
  osmType: "node" | "way" | "relation";
  osmId: number;
  name: string;
  formattedAddress: string;
  city: string | null;
  district: string | null;
  latitude: number;
  longitude: number;
  phone: string | null;
  websiteUrl: string | null;
  openingHours: string | null;
  wheelchairAccess: boolean | null;
  specialties: string[];
  osmUrl: string;
  googleSearchUrl: string;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  googleRatingUrl?: string | null;
  googleRatingSyncedAt?: string | null;
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

export type ClinicCampaign = {
  id: string;
  title: string;
  description: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type ClinicTreatmentPackage = {
  id: string;
  name: string;
  treatmentName: string | null;
  description: string | null;
  price: number | null;
  currency: "TRY" | "EUR" | "USD";
  startsAt: string | null;
  endsAt: string | null;
};

export type Clinic = {
  slug: string;
  name: string;
  description: string | null;
  foundingYear: number | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  distanceKm: number | null;
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
  unavailableTreatments: string[];
  firstExamFee: number | null;
  freeInitialExam: boolean;
  initialExamIncludes: string[];
  financingOptions: string[];
  patientPerks: string[];
  technologyHighlights: string[];
  hygieneHighlights: string[];
  clinicManagerFeatures: string[];
  doctors: Dentist[];
  prices: ClinicPrice[];
  campaigns: ClinicCampaign[];
  packages: ClinicTreatmentPackage[];
  google: GoogleSummary;
  nextAvailableAt: string | null;
  responseTimeHours: number | null;
};

export type ClinicSearchFilters = {
  q?: string;
  city?: string;
  district?: string;
  treatment?: string;
  minGoogleRating?: number;
  minGoogleReviews?: number;
  source?: "all" | "internet";
};
