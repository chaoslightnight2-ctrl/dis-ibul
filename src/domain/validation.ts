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
  verifiedOnly: optionalQueryBoolean,
  openNow: optionalQueryBoolean,
  sort: z
    .enum(["recommended", "nearest", "rating", "reviews", "lowest-price", "soonest"])
    .optional(),
});

export const appointmentRequestSchema = z.object({
  clinicSlug: z.string().min(2),
  treatmentName: z.string().min(2),
  preferredDate: z.string().optional(),
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
  budgetMin: z.coerce.number().nonnegative().optional(),
  budgetMax: z.coerce.number().nonnegative().optional(),
  contactPreference: z.enum(["phone", "email", "whatsapp"]),
  kvkkConsent: z.literal(true),
  healthDataConsent: z.literal(true),
});
