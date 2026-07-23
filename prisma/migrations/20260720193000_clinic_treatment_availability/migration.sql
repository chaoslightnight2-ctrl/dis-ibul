CREATE TYPE "ClinicTreatmentAvailability" AS ENUM ('OFFERED', 'NOT_OFFERED');

ALTER TABLE "ClinicTreatment"
ADD COLUMN "availability" "ClinicTreatmentAvailability" NOT NULL DEFAULT 'OFFERED';
