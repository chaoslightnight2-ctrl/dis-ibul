import { z } from "zod";

const optionalQueryNumber = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  return value;
}, z.coerce.number().nonnegative().optional());

const optionalGoogleRating = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  return value;
}, z.coerce.number().min(0).max(5).optional());

const optionalQueryBoolean = z.preprocess((value) => {
  if (value === "" || value === null || typeof value === "undefined") return undefined;
  if (value === "true" || value === true) return true;
  if (value === "false" || value === false) return false;
  return value;
}, z.boolean().optional());

export const clinicSearchSchema = z.object({
  q: z.string().trim().optional(),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  treatment: z.string().trim().optional(),
  minPrice: optionalQueryNumber,
  maxPrice: optionalQueryNumber,
  minGoogleRating: optionalGoogleRating,
  minGoogleReviews: optionalQueryNumber.pipe(z.number().int().max(1_000_000).optional()),
  verifiedOnly: optionalQueryBoolean,
  openNow: optionalQueryBoolean,
  freeInitialExam: optionalQueryBoolean,
  maxExamFee: optionalQueryNumber,
  source: z.preprocess(
    (value) => value === "google" ? "internet" : value,
    z.enum(["all", "discibul", "internet"]),
  ).default("all"),
  sort: z
    .enum(["recommended", "nearest", "rating", "reviews", "lowest-price", "soonest"])
    .optional(),
});

export const clinicTreatmentCapabilitySchema = z.object({
  treatmentSlug: z.string().trim().min(1).max(120),
  availability: z.enum(["OFFERED", "NOT_OFFERED", "UNKNOWN"]),
});

export const googlePlaceIdSchema = z.string().trim().min(3).max(255).regex(/^[A-Za-z0-9_-]+$/);

export const appointmentRequestSchema = z.object({
  clinicSlug: z.string().min(2),
  treatmentName: z.string().min(2),
  preferredDate: z.string().datetime({ offset: true }).optional(),
  fullName: z.string().min(2),
  phone: z.string().min(7),
  note: z.string().max(1000).optional(),
  kvkkConsent: z.literal(true),
});

export const quoteRequestSchema = z.object({
  clinicSlugs: z.array(z.string().min(2)).min(1).max(4),
  treatmentName: z.string().min(2),
  complaint: z.string().min(10).max(1500),
  city: z.string().min(2),
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(7).max(24),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  hasPriorExam: z.boolean().default(false),
  hasImaging: z.boolean().default(false),
  contactPreference: z.enum(["phone", "email", "whatsapp"]),
  kvkkConsent: z.literal(true),
  healthDataConsent: z.literal(true),
});

export const clinicApplicationSchema = z.object({
  accountType: z.literal("clinic"),
  clinicName: z.string().trim().min(2).max(120),
  ownerName: z.string().trim().min(2).max(100),
  roleTitle: z.enum(["clinic_manager", "dentist", "owner"]),
  email: z.string().email(),
  phone: z.string().trim().min(7).max(24),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  specialties: z.array(z.string().trim().min(2).max(100)).min(1).max(12),
  firstExamFee: z.coerce.number().nonnegative(),
  freeInitialExam: z.boolean(),
  googlePlaceId: z.string().optional(),
  kvkkConsent: z.literal(true),
  moderationConsent: z.literal(true),
});

const httpUrl = z.string().url().max(500).refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "Yalnızca http veya https adresi kullanılabilir.");
const optionalUrl = z.union([z.literal(""), httpUrl]).transform((value) => value || null);
const optionalText = (max: number) => z.union([z.literal(""), z.string().trim().max(max)]).transform((value) => value || null);

export const clinicProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText(2500),
  foundingYear: z.union([z.null(), z.coerce.number().int().min(1900).max(new Date().getFullYear())]),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  neighborhood: optionalText(100),
  address: z.string().trim().min(10).max(500),
  phone: z.string().trim().min(7).max(24),
  whatsapp: optionalText(24),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).transform((value) => value || null),
  website: optionalUrl,
  freeInitialExam: z.boolean(),
  firstExamFee: z.union([z.null(), z.coerce.number().nonnegative().max(1_000_000)]),
  initialExamIncludes: z.array(z.string().trim().min(2).max(120)).max(10),
  languages: z.array(z.string().trim().min(2).max(60)).min(1).max(12),
  paymentOptions: z.array(z.string().trim().min(2).max(100)).max(12),
  emergencyService: z.boolean(),
  wheelchairAccess: z.boolean(),
  parking: z.boolean(),
  onlineConsultation: z.boolean(),
  childFriendly: z.boolean(),
  sedation: z.boolean(),
}).superRefine((value, context) => {
  if (!value.freeInitialExam && value.firstExamFee === null) {
    context.addIssue({ code: "custom", path: ["firstExamFee"], message: "İlk muayene ücreti gerekli." });
  }
});

export const clinicPriceSchema = z.object({
  treatmentSlug: z.string().trim().min(2).max(120),
  pricingMode: z.enum(["fixed", "range"]),
  fixedPrice: z.union([z.null(), z.coerce.number().positive().max(10_000_000)]),
  minPrice: z.union([z.null(), z.coerce.number().positive().max(10_000_000)]),
  maxPrice: z.union([z.null(), z.coerce.number().positive().max(10_000_000)]),
  currency: z.enum(["TRY", "EUR", "USD"]),
  priceUnit: z.string().trim().min(2).max(100),
  vatIncluded: z.boolean(),
  examIncluded: z.boolean(),
  imagingIncluded: z.boolean(),
  packageContent: optionalText(1000),
  extraFeeConditions: optionalText(1000),
}).superRefine((value, context) => {
  if (value.pricingMode === "fixed" && value.fixedPrice === null) {
    context.addIssue({ code: "custom", path: ["fixedPrice"], message: "Sabit fiyat gerekli." });
  }
  if (value.pricingMode === "range") {
    if (value.minPrice === null || value.maxPrice === null) {
      context.addIssue({ code: "custom", path: ["minPrice"], message: "Fiyat aralığı gerekli." });
    } else if (value.minPrice > value.maxPrice) {
      context.addIssue({ code: "custom", path: ["maxPrice"], message: "Maksimum fiyat minimumdan düşük olamaz." });
    }
  }
});

export const clinicBranchSchema = z.object({
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  district: z.string().trim().min(2).max(80),
  address: z.string().trim().min(10).max(500),
  phone: z.union([z.literal(""), z.string().trim().min(7).max(24)]).transform((value) => value || null),
  email: z.union([z.literal(""), z.string().trim().email().max(254)]).transform((value) => value || null),
  isMain: z.boolean(),
});

export const clinicDentistSchema = z.object({
  fullName: z.string().trim().min(3).max(120),
  title: z.string().trim().min(2).max(120),
  university: optionalText(180),
  graduationYear: z.union([z.null(), z.coerce.number().int().min(1950).max(new Date().getFullYear())]),
  experienceYears: z.coerce.number().int().min(0).max(70),
  about: optionalText(2500),
  languages: z.array(z.string().trim().min(2).max(60)).min(1).max(12),
  acceptsChildren: z.boolean(),
  acceptsInternationalPatients: z.boolean(),
  onlineConsultation: z.boolean(),
});

export const clinicTeamInvitationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(["CLINIC_MANAGER", "DENTIST"]),
});

export const clinicTeamRoleSchema = z.object({
  role: z.enum(["CLINIC_MANAGER", "DENTIST"]),
});

const timeValue = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
export const clinicWorkingHoursSchema = z.object({
  appointmentDurationMinutes: z.coerce.number().int().min(10).max(180),
  bookingLeadHours: z.coerce.number().int().min(0).max(168),
  bookingWindowDays: z.coerce.number().int().min(1).max(365),
  hours: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    opensAt: timeValue,
    closesAt: timeValue,
    isClosed: z.boolean(),
  })).length(7),
}).superRefine((value, context) => {
  if (new Set(value.hours.map((hour) => hour.dayOfWeek)).size !== 7) {
    context.addIssue({ code: "custom", path: ["hours"], message: "Her gün bir kez tanımlanmalıdır." });
  }
  value.hours.forEach((hour, index) => {
    if (!hour.isClosed && hour.opensAt >= hour.closesAt) {
      context.addIssue({ code: "custom", path: ["hours", index, "closesAt"], message: "Kapanış saati açılıştan sonra olmalıdır." });
    }
  });
});

export const clinicClosedDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().max(250).optional(),
});

export const clinicCampaignSchema = z.object({
  title: z.string().trim().min(3).max(160),
  description: optionalText(1200),
  startsAt: z.union([z.literal(""), z.string().datetime({ offset: true })]).transform((value) => value || null),
  endsAt: z.union([z.literal(""), z.string().datetime({ offset: true })]).transform((value) => value || null),
  isActive: z.boolean(),
}).superRefine((value, context) => {
  if (value.startsAt && value.endsAt && new Date(value.startsAt) >= new Date(value.endsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "Bitiş tarihi başlangıçtan sonra olmalıdır." });
  }
});

export const clinicTreatmentPackageSchema = z.object({
  treatmentSlug: z.string().trim().max(120).optional(),
  name: z.string().trim().min(3).max(160),
  description: optionalText(1200),
  price: z.union([z.null(), z.coerce.number().positive().max(10_000_000)]),
  currency: z.enum(["TRY", "EUR", "USD"]),
  startsAt: z.union([z.literal(""), z.string().datetime({ offset: true })]).transform((value) => value || null),
  endsAt: z.union([z.literal(""), z.string().datetime({ offset: true })]).transform((value) => value || null),
  isActive: z.boolean(),
}).superRefine((value, context) => {
  if (value.startsAt && value.endsAt && new Date(value.startsAt) >= new Date(value.endsAt)) {
    context.addIssue({ code: "custom", path: ["endsAt"], message: "Bitiş tarihi başlangıçtan sonra olmalıdır." });
  }
});

export const clinicApplicationDecisionSchema = z.object({
  decision: z.enum(["VERIFIED", "ADDITIONAL_DOCUMENT_REQUIRED", "REJECTED", "SUSPENDED"]),
  note: z.string().trim().max(1000).optional(),
}).superRefine((value, context) => {
  if (value.decision !== "VERIFIED" && !value.note) {
    context.addIssue({ code: "custom", path: ["note"], message: "Karar notu gerekli." });
  }
});

export const billingCheckoutSchema = z.object({
  planSlug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(64),
  identityNumber: z.string().trim().regex(/^\d{10,11}$/).optional(),
  gsmNumber: z.string().trim().min(10).max(20).regex(/^[+\d\s()-]+$/).optional(),
  zipCode: z.string().trim().regex(/^\d{5}$/).optional(),
  termsAccepted: z.literal(true),
});

export const billingCancellationSchema = z.object({
  confirmed: z.literal(true),
});
