ALTER TABLE "PublicClinicDirectory"
  ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(9, 6),
  ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(9, 6);
