import type { Prisma } from "@prisma/client";
import { dateKeyInIstanbul } from "@/domain/availability";
import type { Clinic } from "@/domain/types";
import { prisma } from "@/lib/prisma";
import { getClinicAvailability } from "@/services/appointments/availability";

const publicClinicInclude = {
  treatments: {
    where: { status: "APPROVED" },
    include: { treatment: { include: { specialty: true } } },
  },
  prices: {
    where: { moderationStatus: "APPROVED" },
    include: { treatment: true },
    orderBy: { updatedAt: "desc" },
  },
  dentists: {
    where: { verificationStatus: "VERIFIED" },
    include: { specialties: { include: { specialty: true } } },
    orderBy: { fullName: "asc" },
  },
  googleConnection: {
    include: { reviews: { orderBy: [{ publishedAt: "desc" }, { fetchedAt: "desc" }], take: 5 } },
  },
  workingHours: {
    where: { branchId: null, dentistId: null },
    orderBy: { dayOfWeek: "asc" },
  },
  campaigns: { where: { isActive: true }, orderBy: { createdAt: "desc" } },
  packages: { where: { isActive: true }, include: { treatment: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
  quoteRequestClinics: {
    where: { response: { isNot: null } },
    include: {
      quoteRequest: { select: { createdAt: true } },
      response: { select: { createdAt: true } },
    },
    take: 20,
    orderBy: { response: { createdAt: "desc" } },
  },
} satisfies Prisma.ClinicInclude;

type PublicClinicRow = Prisma.ClinicGetPayload<{ include: typeof publicClinicInclude }>;

function derivePatientPerks(clinic: PublicClinicRow) {
  return [
    clinic.onlineConsultation ? "Online ön görüşme" : null,
    clinic.emergencyService ? "Acil hizmet" : null,
    clinic.childFriendly ? "Çocuk dostu klinik" : null,
    clinic.wheelchairAccess ? "Engelli erişimine uygun" : null,
    clinic.parking ? "Otopark" : null,
    clinic.sedation ? "Sedasyon imkanı" : null,
  ].filter((item): item is string => Boolean(item));
}

function isCurrent(offer: { startsAt: Date | null; endsAt: Date | null }, now: Date) {
  return (!offer.startsAt || offer.startsAt <= now) && (!offer.endsAt || offer.endsAt >= now);
}

function isOpenNow(clinic: PublicClinicRow, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Istanbul", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const currentTime = `${parts.hour}:${parts.minute}`;
  const workingHour = clinic.workingHours.find((hour) => hour.dayOfWeek === dayOfWeek);
  return Boolean(workingHour && !workingHour.isClosed && currentTime >= workingHour.opensAt && currentTime < workingHour.closesAt);
}

export function toPublicClinic(clinic: PublicClinicRow): Clinic {
  const now = new Date();
  const treatmentNames = new Set([
    ...clinic.treatments.filter((item) => item.availability === "OFFERED").map((item) => item.treatment.name),
    ...clinic.prices.map((item) => item.treatment.name),
  ]);
  const unavailableTreatmentNames = clinic.treatments
    .filter((item) => item.availability === "NOT_OFFERED")
    .map((item) => item.treatment.name);
  const specialtyNames = new Set([
    ...clinic.treatments
      .filter((item) => item.availability === "OFFERED")
      .flatMap((item) => item.treatment.specialty?.name ? [item.treatment.specialty.name] : []),
    ...clinic.dentists.flatMap((dentist) => dentist.specialties.map((item) => item.specialty.name)),
  ]);
  const google = clinic.googleConnection;
  const responseHours = clinic.quoteRequestClinics.flatMap((item) => item.response
    ? [(item.response.createdAt.getTime() - item.quoteRequest.createdAt.getTime()) / 3_600_000]
    : []).filter((hours) => hours >= 0);

  return {
    slug: clinic.slug,
    name: clinic.name,
    description: clinic.description,
    foundingYear: clinic.foundingYear,
    logoUrl: clinic.logoUrl,
    coverImageUrl: clinic.coverImageUrl,
    city: clinic.city,
    district: clinic.district,
    neighborhood: clinic.neighborhood ?? "",
    address: clinic.address,
    phone: clinic.phone,
    whatsapp: clinic.whatsapp,
    email: clinic.email,
    website: clinic.website,
    distanceKm: null,
    verified: clinic.verificationStatus === "VERIFIED",
    sponsored: clinic.isSponsored,
    emergencyService: clinic.emergencyService,
    openNow: isOpenNow(clinic, now),
    wheelchairAccess: clinic.wheelchairAccess,
    parking: clinic.parking,
    onlineConsultation: clinic.onlineConsultation,
    childFriendly: clinic.childFriendly,
    sedation: clinic.sedation,
    languages: clinic.languages,
    specialties: [...specialtyNames],
    treatments: [...treatmentNames],
    unavailableTreatments: unavailableTreatmentNames,
    firstExamFee: clinic.firstExamFee === null ? null : Number(clinic.firstExamFee),
    freeInitialExam: clinic.freeInitialExam,
    initialExamIncludes: clinic.initialExamIncludes,
    financingOptions: clinic.paymentOptions,
    patientPerks: derivePatientPerks(clinic),
    technologyHighlights: [],
    hygieneHighlights: [],
    clinicManagerFeatures: [],
    doctors: clinic.dentists.map((dentist) => ({
      slug: dentist.slug,
      fullName: dentist.fullName,
      title: dentist.title,
      specialties: dentist.specialties.map((item) => item.specialty.name),
      experienceYears: dentist.experienceYears,
      languages: dentist.languages,
      about: dentist.about ?? "",
      verified: dentist.verificationStatus === "VERIFIED",
    })),
    prices: clinic.prices.map((price) => ({
      treatmentSlug: price.treatment.slug,
      treatmentName: price.treatment.name,
      minPrice: price.minPrice === null ? undefined : Number(price.minPrice),
      maxPrice: price.maxPrice === null ? undefined : Number(price.maxPrice),
      fixedPrice: price.fixedPrice === null ? undefined : Number(price.fixedPrice),
      currency: price.currency as "TRY" | "EUR" | "USD",
      unit: price.priceUnit,
      updatedAt: price.updatedAt.toISOString(),
      includes: [
        price.examIncluded ? "Muayene" : null,
        price.imagingIncluded ? "Görüntüleme" : null,
        price.packageContent,
      ].filter((item): item is string => Boolean(item)),
      extraFeeConditions: price.extraFeeConditions ?? "Ek ücret koşulu belirtilmedi.",
    })),
    campaigns: clinic.campaigns.filter((campaign) => isCurrent(campaign, now)).map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      startsAt: campaign.startsAt?.toISOString() ?? null,
      endsAt: campaign.endsAt?.toISOString() ?? null,
    })),
    packages: clinic.packages.filter((item) => isCurrent(item, now)).map((item) => ({
      id: item.id,
      name: item.name,
      treatmentName: item.treatment?.name ?? null,
      description: item.description,
      price: item.price === null ? null : Number(item.price),
      currency: item.currency as "TRY" | "EUR" | "USD",
      startsAt: item.startsAt?.toISOString() ?? null,
      endsAt: item.endsAt?.toISOString() ?? null,
    })),
    google: {
      placeId: google?.googlePlaceId ?? "",
      rating: google?.googleRating === null || google?.googleRating === undefined ? null : Number(google.googleRating),
      reviewCount: google?.googleUserRatingsTotal ?? null,
      mapsUrl: google?.googleMapsUrl ?? "",
      writeReviewUrl: google?.googleWriteReviewUrl ?? "",
      lastSyncedAt: google?.googleLastSyncedAt?.toISOString() ?? null,
      syncStatus: google?.googleSyncStatus ?? "NEVER_SYNCED",
      isDemoData: false,
      reviews: google?.reviews.map((review) => ({
        id: review.id,
        authorName: review.authorDisplayName,
        rating: review.rating,
        text: review.text,
        clinicResponse: review.clinicResponse,
        sourceUrl: review.sourceUrl,
        publishedAt: review.publishedAt?.toISOString() ?? null,
      })) ?? [],
    },
    nextAvailableAt: null,
    responseTimeHours: responseHours.length
      ? Math.max(1, Math.round(responseHours.reduce((sum, hours) => sum + hours, 0) / responseHours.length))
      : null,
  };
}

export async function getPublishedClinics() {
  const clinics = await prisma.clinic.findMany({
    where: { isPublished: true },
    include: publicClinicInclude,
    orderBy: [{ isSponsored: "desc" }, { updatedAt: "desc" }],
  });

  return clinics.map(toPublicClinic).sort((a, b) =>
    Number(b.sponsored) - Number(a.sponsored)
    || Number(b.verified) - Number(a.verified)
    || a.name.localeCompare(b.name, "tr-TR"));
}

export async function getPublishedClinicBySlug(slug: string) {
  const clinic = await prisma.clinic.findFirst({
    where: { slug, isPublished: true },
    include: publicClinicInclude,
  });

  if (!clinic) return null;
  const publicClinic = toPublicClinic(clinic);
  let nextAvailableAt: string | null = null;
  for (let offset = 0; offset < Math.min(clinic.bookingWindowDays, 14); offset += 1) {
    const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
    const availability = await getClinicAvailability({ clinicId: clinic.id, date: dateKeyInIstanbul(date) });
    if (availability.slots[0]) {
      nextAvailableAt = availability.slots[0].start;
      break;
    }
  }
  return { ...publicClinic, nextAvailableAt };
}
