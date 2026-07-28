ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT;
ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3);
ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googleVisibilityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "OsmClinicIndex" ADD COLUMN IF NOT EXISTS "googleVisibilityCheckedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "OsmClinicIndex_isActive_idx" ON "OsmClinicIndex"("isActive");
CREATE INDEX IF NOT EXISTS "OsmClinicIndex_googleVisibilityStatus_idx" ON "OsmClinicIndex"("googleVisibilityStatus");

ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "inactiveReason" TEXT;
ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "inactiveAt" TIMESTAMP(3);
ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googlePlaceId" TEXT;
ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googleVisibilityStatus" TEXT NOT NULL DEFAULT 'UNKNOWN';
ALTER TABLE "PublicClinicDirectory" ADD COLUMN IF NOT EXISTS "googleVisibilityCheckedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_isActive_idx" ON "PublicClinicDirectory"("isActive");
CREATE INDEX IF NOT EXISTS "PublicClinicDirectory_googleVisibilityStatus_idx" ON "PublicClinicDirectory"("googleVisibilityStatus");
