import type { OsmClinicIndex, Prisma } from "@prisma/client";
import type { ClinicSearchFilters, OpenStreetMapClinic } from "@/domain/types";
import { prisma } from "@/lib/prisma";

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function osmRef(clinic: Pick<OpenStreetMapClinic, "osmType" | "osmId">) {
  return `${clinic.osmType}/${clinic.osmId}`;
}

async function ensureOsmClinicIndexVisibilityColumns() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googleVisibilityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googleVisibilityCheckedAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OsmClinicIndex_isActive_idx" ON "OsmClinicIndex"("isActive")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "OsmClinicIndex_googleVisibilityStatus_idx" ON "OsmClinicIndex"("googleVisibilityStatus")`);
}

function mapIndexedClinic(row: OsmClinicIndex): OpenStreetMapClinic {
  return {
    osmType: row.osmType as OpenStreetMapClinic["osmType"],
    osmId: Number(row.osmId),
    name: row.name,
    formattedAddress: row.formattedAddress,
    city: row.city,
    district: row.district,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    openingHours: row.openingHours,
    wheelchairAccess: row.wheelchairAccess,
    specialties: row.specialties,
    osmUrl: row.osmUrl,
    googleSearchUrl: row.googleSearchUrl,
    googlePlaceId: row.googlePlaceId,
    googleVisibilityStatus: row.googleVisibilityStatus as OpenStreetMapClinic["googleVisibilityStatus"],
    googleVisibilityCheckedAt: row.googleVisibilityCheckedAt?.toISOString() ?? null,
    googleRating: row.googleRating === null ? null : Number(row.googleRating),
    googleReviewCount: row.googleReviewCount,
    googleRatingUrl: row.googleRatingUrl,
    googleRatingSyncedAt: row.googleRatingSyncedAt?.toISOString() ?? null,
  };
}

export async function searchOsmClinicIndex(filters: ClinicSearchFilters, limit = 1000) {
  const city = normalize(filters.city);
  const district = normalize(filters.district);
  const query = normalize(filters.q);
  const treatment = normalize(filters.treatment);

  const where: Prisma.OsmClinicIndexWhereInput = {
    isActive: true,
    NOT: { googleVisibilityStatus: "NOT_FOUND" },
    ...(city ? { city: { equals: filters.city, mode: "insensitive" } } : {}),
    ...(district ? { district: { contains: filters.district, mode: "insensitive" } } : {}),
    ...(typeof filters.minGoogleRating === "number" ? { googleRating: { gte: filters.minGoogleRating } } : {}),
    ...(typeof filters.minGoogleReviews === "number" ? { googleReviewCount: { gte: filters.minGoogleReviews } } : {}),
    ...(query || treatment ? {
      AND: [
        ...(query ? [{
          OR: [
            { name: { contains: filters.q, mode: "insensitive" as const } },
            { formattedAddress: { contains: filters.q, mode: "insensitive" as const } },
            { specialties: { has: filters.q } },
          ],
        }] : []),
        ...(treatment ? [{
          OR: [
            { name: { contains: filters.treatment, mode: "insensitive" as const } },
            { formattedAddress: { contains: filters.treatment, mode: "insensitive" as const } },
            { specialties: { has: filters.treatment } },
          ],
        }] : []),
      ],
    } : {}),
  };

  try {
    await ensureOsmClinicIndexVisibilityColumns();
    const rows = await prisma.osmClinicIndex.findMany({
      where,
      orderBy: [
        { googleRating: { sort: "desc", nulls: "last" } },
        { googleReviewCount: { sort: "desc", nulls: "last" } },
        { name: "asc" },
      ],
      take: limit,
    });
    return rows.map(mapIndexedClinic);
  } catch {
    return [];
  }
}

export async function upsertOsmClinicIndex(clinics: OpenStreetMapClinic[], source = "openstreetmap") {
  if (!clinics.length) return { count: 0 };
  let count = 0;
  const now = new Date();

  for (const clinic of clinics) {
    try {
      await prisma.osmClinicIndex.upsert({
        where: { osmRef: osmRef(clinic) },
        update: {
          name: clinic.name,
          formattedAddress: clinic.formattedAddress,
          city: clinic.city,
          district: clinic.district,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          phone: clinic.phone,
          websiteUrl: clinic.websiteUrl,
          openingHours: clinic.openingHours,
          wheelchairAccess: clinic.wheelchairAccess,
          specialties: clinic.specialties,
          osmUrl: clinic.osmUrl,
          googleSearchUrl: clinic.googleSearchUrl,
          googlePlaceId: clinic.googlePlaceId ?? undefined,
          googleVisibilityStatus: clinic.googleVisibilityStatus ?? undefined,
          googleVisibilityCheckedAt: clinic.googleVisibilityCheckedAt ? new Date(clinic.googleVisibilityCheckedAt) : undefined,
          googleRating: clinic.googleRating ?? undefined,
          googleReviewCount: clinic.googleReviewCount ?? undefined,
          googleRatingUrl: clinic.googleRatingUrl ?? undefined,
          googleRatingSyncedAt: clinic.googleRatingSyncedAt ? new Date(clinic.googleRatingSyncedAt) : undefined,
          source,
          lastSeenAt: now,
        },
        create: {
          osmRef: osmRef(clinic),
          osmType: clinic.osmType,
          osmId: String(clinic.osmId),
          name: clinic.name,
          formattedAddress: clinic.formattedAddress,
          city: clinic.city,
          district: clinic.district,
          latitude: clinic.latitude,
          longitude: clinic.longitude,
          phone: clinic.phone,
          websiteUrl: clinic.websiteUrl,
          openingHours: clinic.openingHours,
          wheelchairAccess: clinic.wheelchairAccess,
          specialties: clinic.specialties,
          osmUrl: clinic.osmUrl,
          googleSearchUrl: clinic.googleSearchUrl,
          googleRating: clinic.googleRating ?? undefined,
          googleReviewCount: clinic.googleReviewCount ?? undefined,
          googleRatingUrl: clinic.googleRatingUrl ?? undefined,
          googleRatingSyncedAt: clinic.googleRatingSyncedAt ? new Date(clinic.googleRatingSyncedAt) : undefined,
          source,
          lastSeenAt: now,
        },
      });
      count += 1;
    } catch {
      // Keep indexing best-effort; one malformed community record should not stop the batch.
    }
  }

  return { count };
}

