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
  "googleSearchUrl" TEXT NOT NULL,
  "googleRating" DECIMAL(2, 1),
  "googleReviewCount" INTEGER,
  "googleRatingUrl" TEXT,
  "googleRatingSyncedAt" TIMESTAMP(3),
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PublicClinicDirectory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PublicClinicDirectory_sourceRef_key" ON "PublicClinicDirectory"("sourceRef");
CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_city_district_idx" ON "PublicClinicDirectory"("city", "district");
CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_name_idx" ON "PublicClinicDirectory"("name");
