import type { ClinicSearchFilters, PublicDirectoryClinic } from "@/domain/types";
import { prisma } from "@/lib/prisma";

type DirectoryClinicRow = {
  sourceRef: string;
  name: string;
  formattedAddress: string;
  city: string | null;
  district: string | null;
  phone: string | null;
  websiteUrl: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceUpdatedAt: Date | null;
  googlePlaceId: string | null;
  googleVisibilityStatus: string;
  googleVisibilityCheckedAt: Date | null;
  googleSearchUrl: string;
  googleRating: unknown | null;
  googleReviewCount: number | null;
  googleRatingUrl: string | null;
  googleRatingSyncedAt: Date | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapRow(row: DirectoryClinicRow): PublicDirectoryClinic {
  return {
    sourceRef: row.sourceRef,
    name: row.name,
    formattedAddress: row.formattedAddress,
    city: row.city,
    district: row.district,
    phone: row.phone,
    websiteUrl: row.websiteUrl,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    sourceUpdatedAt: row.sourceUpdatedAt?.toISOString() ?? null,
    googlePlaceId: row.googlePlaceId,
    googleVisibilityStatus: row.googleVisibilityStatus as PublicDirectoryClinic["googleVisibilityStatus"],
    googleVisibilityCheckedAt: row.googleVisibilityCheckedAt?.toISOString() ?? null,
    googleSearchUrl: row.googleSearchUrl,
    googleRating: toNumber(row.googleRating),
    googleReviewCount: row.googleReviewCount,
    googleRatingUrl: row.googleRatingUrl,
    googleRatingSyncedAt: row.googleRatingSyncedAt?.toISOString() ?? null,
  };
}

function matchesFilters(clinic: PublicDirectoryClinic, filters: ClinicSearchFilters) {
  const city = normalize(filters.city);
  const district = normalize(filters.district);
  const query = normalize(filters.q);
  const treatment = normalize(filters.treatment);

  if (city && normalize(clinic.city) !== city) return false;
  if (district && !normalize(clinic.district).includes(district) && !normalize(clinic.formattedAddress).includes(district)) return false;
  if (typeof filters.minGoogleRating === "number" && (clinic.googleRating ?? 0) < filters.minGoogleRating) return false;
  if (typeof filters.minGoogleReviews === "number" && (clinic.googleReviewCount ?? 0) < filters.minGoogleReviews) return false;

  const searchable = [
    clinic.name,
    clinic.formattedAddress,
    clinic.city,
    clinic.district,
    clinic.phone,
    clinic.sourceName,
  ].map(normalize);

  if (query && !searchable.some((value) => value.includes(query))) return false;
  if (treatment && !searchable.some((value) => value.includes(treatment))) return false;
  return true;
}

export async function ensurePublicClinicDirectoryTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "PublicClinicDirectory" (
      "id" TEXT NOT NULL,
      "sourceRef" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "formattedAddress" TEXT NOT NULL,
      "city" TEXT,
      "district" TEXT,
      "phone" TEXT,
      "websiteUrl" TEXT,
      "sourceName" TEXT NOT NULL,
      "sourceUrl" TEXT NOT NULL,
      "sourceUpdatedAt" TIMESTAMP(3),
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "inactiveReason" TEXT,
      "inactiveAt" TIMESTAMP(3),
      "googlePlaceId" TEXT,
      "googleVisibilityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
      "googleVisibilityCheckedAt" TIMESTAMP(3),
      "googleSearchUrl" TEXT NOT NULL,
      "googleRating" DECIMAL(2, 1),
      "googleReviewCount" INTEGER,
      "googleRatingUrl" TEXT,
      "googleRatingSyncedAt" TIMESTAMP(3),
      "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "PublicClinicDirectory_pkey" PRIMARY KEY ("id")
    )
  `);
  await prisma.$executeRawUnsafe(
    `CREATE UNIQUE INDEX IF NOT EXISTS "PublicClinicDirectory_sourceRef_key" ON "PublicClinicDirectory"("sourceRef")`,
  );
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_city_district_idx" ON "PublicClinicDirectory"("city", "district")`,
  );
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googleVisibilityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN'`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googleVisibilityCheckedAt" TIMESTAMP(3)`);
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_name_idx" ON "PublicClinicDirectory"("name")`,
  );
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_isActive_idx" ON "PublicClinicDirectory"("isActive")`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_googleVisibilityStatus_idx" ON "PublicClinicDirectory"("googleVisibilityStatus")`);
}

export async function searchPublicClinicDirectory(filters: ClinicSearchFilters, limit = 2000) {
  try {
    await ensurePublicClinicDirectoryTable();
    const rows = await prisma.$queryRaw<DirectoryClinicRow[]>`
      SELECT "sourceRef", "name", "formattedAddress", "city", "district", "phone", "websiteUrl",
             "sourceName", "sourceUrl", "sourceUpdatedAt", "googlePlaceId", "googleVisibilityStatus",
             "googleVisibilityCheckedAt", "googleSearchUrl", "googleRating",
             "googleReviewCount", "googleRatingUrl", "googleRatingSyncedAt"
      FROM "PublicClinicDirectory"
      WHERE "isActive" = true AND "googleVisibilityStatus" <> 'NOT_FOUND'
      ORDER BY "name" ASC
      LIMIT ${limit}
    `;
    return rows.map(mapRow).filter((clinic) => matchesFilters(clinic, filters));
  } catch {
    return [];
  }
}

export async function upsertPublicClinicDirectory(clinics: PublicDirectoryClinic[]) {
  if (!clinics.length) return { count: 0 };
  let count = 0;
  const now = new Date();

  await ensurePublicClinicDirectoryTable();

  for (const clinic of clinics) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "PublicClinicDirectory" (
          "id", "sourceRef", "name", "formattedAddress", "city", "district", "phone", "websiteUrl",
          "sourceName", "sourceUrl", "sourceUpdatedAt", "googlePlaceId", "googleVisibilityStatus",
          "googleVisibilityCheckedAt", "googleSearchUrl", "googleRating", "googleReviewCount",
          "googleRatingUrl", "googleRatingSyncedAt", "lastSeenAt", "updatedAt"
        )
        VALUES (
          ${clinic.sourceRef}, ${clinic.sourceRef}, ${clinic.name}, ${clinic.formattedAddress}, ${clinic.city},
          ${clinic.district}, ${clinic.phone}, ${clinic.websiteUrl}, ${clinic.sourceName}, ${clinic.sourceUrl},
          ${clinic.sourceUpdatedAt ? new Date(clinic.sourceUpdatedAt) : null}, ${clinic.googlePlaceId ?? null},
          ${clinic.googleVisibilityStatus ?? "UNKNOWN"}, ${clinic.googleVisibilityCheckedAt ? new Date(clinic.googleVisibilityCheckedAt) : null},
          ${clinic.googleSearchUrl}, ${clinic.googleRating ?? null}, ${clinic.googleReviewCount ?? null},
          ${clinic.googleRatingUrl ?? null}, ${clinic.googleRatingSyncedAt ? new Date(clinic.googleRatingSyncedAt) : null}, ${now}, ${now}
        )
        ON CONFLICT ("sourceRef") DO UPDATE SET
          "name" = EXCLUDED."name",
          "formattedAddress" = EXCLUDED."formattedAddress",
          "city" = EXCLUDED."city",
          "district" = EXCLUDED."district",
          "phone" = EXCLUDED."phone",
          "websiteUrl" = EXCLUDED."websiteUrl",
          "sourceName" = EXCLUDED."sourceName",
          "sourceUrl" = EXCLUDED."sourceUrl",
          "sourceUpdatedAt" = EXCLUDED."sourceUpdatedAt",
          "googlePlaceId" = COALESCE(EXCLUDED."googlePlaceId", "PublicClinicDirectory"."googlePlaceId"),
          "googleVisibilityStatus" = EXCLUDED."googleVisibilityStatus",
          "googleVisibilityCheckedAt" = COALESCE(EXCLUDED."googleVisibilityCheckedAt", "PublicClinicDirectory"."googleVisibilityCheckedAt"),
          "googleSearchUrl" = EXCLUDED."googleSearchUrl",
          "googleRating" = COALESCE(EXCLUDED."googleRating", "PublicClinicDirectory"."googleRating"),
          "googleReviewCount" = COALESCE(EXCLUDED."googleReviewCount", "PublicClinicDirectory"."googleReviewCount"),
          "googleRatingUrl" = COALESCE(EXCLUDED."googleRatingUrl", "PublicClinicDirectory"."googleRatingUrl"),
          "googleRatingSyncedAt" = COALESCE(EXCLUDED."googleRatingSyncedAt", "PublicClinicDirectory"."googleRatingSyncedAt"),
          "lastSeenAt" = EXCLUDED."lastSeenAt",
          "updatedAt" = EXCLUDED."updatedAt"
      `;
      count += 1;
    } catch {
      // Keep official directory imports best-effort; one malformed row should not stop the batch.
    }
  }

  return { count };
}
