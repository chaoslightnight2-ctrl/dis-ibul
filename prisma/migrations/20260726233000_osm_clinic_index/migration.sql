CREATE TABLE "OsmClinicIndex" (
    "id" TEXT NOT NULL,
    "osmRef" TEXT NOT NULL,
    "osmType" TEXT NOT NULL,
    "osmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "formattedAddress" TEXT NOT NULL,
    "city" TEXT,
    "district" TEXT,
    "latitude" DECIMAL(9,6) NOT NULL,
    "longitude" DECIMAL(9,6) NOT NULL,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "openingHours" TEXT,
    "wheelchairAccess" BOOLEAN,
    "specialties" TEXT[],
    "osmUrl" TEXT NOT NULL,
    "googleSearchUrl" TEXT NOT NULL,
    "googleRating" DECIMAL(2,1),
    "googleReviewCount" INTEGER,
    "googleRatingUrl" TEXT,
    "googleRatingSyncedAt" TIMESTAMP(3),
    "source" TEXT NOT NULL DEFAULT 'openstreetmap',
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OsmClinicIndex_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OsmClinicIndex_osmRef_key" ON "OsmClinicIndex"("osmRef");
CREATE INDEX "OsmClinicIndex_city_district_idx" ON "OsmClinicIndex"("city", "district");
CREATE INDEX "OsmClinicIndex_name_idx" ON "OsmClinicIndex"("name");
CREATE INDEX "OsmClinicIndex_googleRating_idx" ON "OsmClinicIndex"("googleRating");
CREATE INDEX "OsmClinicIndex_googleReviewCount_idx" ON "OsmClinicIndex"("googleReviewCount");
CREATE INDEX "OsmClinicIndex_lastSeenAt_idx" ON "OsmClinicIndex"("lastSeenAt");
