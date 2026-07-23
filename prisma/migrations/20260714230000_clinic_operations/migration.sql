ALTER TABLE "Clinic"
  ADD COLUMN "appointmentDurationMinutes" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "bookingLeadHours" INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN "bookingWindowDays" INTEGER NOT NULL DEFAULT 60;

ALTER TABLE "TreatmentPackage"
  ADD COLUMN "startsAt" TIMESTAMP(3),
  ADD COLUMN "endsAt" TIMESTAMP(3),
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Campaign"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "WorkingHour" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT,
  "dentistId" TEXT,
  "dayOfWeek" INTEGER NOT NULL,
  "opensAt" TEXT NOT NULL,
  "closesAt" TEXT NOT NULL,
  "isClosed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkingHour_dayOfWeek_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6)
);

CREATE TABLE "ClinicClosedDay" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT,
  "dentistId" TEXT,
  "date" DATE NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicClosedDay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkingHour_clinicId_dayOfWeek_idx" ON "WorkingHour"("clinicId", "dayOfWeek");
CREATE INDEX "WorkingHour_branchId_dayOfWeek_idx" ON "WorkingHour"("branchId", "dayOfWeek");
CREATE INDEX "WorkingHour_dentistId_dayOfWeek_idx" ON "WorkingHour"("dentistId", "dayOfWeek");
CREATE UNIQUE INDEX "WorkingHour_clinic_base_day_key" ON "WorkingHour"("clinicId", "dayOfWeek") WHERE "branchId" IS NULL AND "dentistId" IS NULL;
CREATE UNIQUE INDEX "WorkingHour_branch_day_key" ON "WorkingHour"("branchId", "dayOfWeek") WHERE "branchId" IS NOT NULL AND "dentistId" IS NULL;
CREATE UNIQUE INDEX "WorkingHour_dentist_day_key" ON "WorkingHour"("dentistId", "dayOfWeek") WHERE "dentistId" IS NOT NULL;

CREATE INDEX "ClinicClosedDay_clinicId_date_idx" ON "ClinicClosedDay"("clinicId", "date");
CREATE INDEX "ClinicClosedDay_branchId_date_idx" ON "ClinicClosedDay"("branchId", "date");
CREATE INDEX "ClinicClosedDay_dentistId_date_idx" ON "ClinicClosedDay"("dentistId", "date");
CREATE UNIQUE INDEX "ClinicClosedDay_clinic_base_date_key" ON "ClinicClosedDay"("clinicId", "date") WHERE "branchId" IS NULL AND "dentistId" IS NULL;

CREATE INDEX "AppointmentRequest_clinicId_preferredDate_idx" ON "AppointmentRequest"("clinicId", "preferredDate");
CREATE INDEX "AppointmentRequest_dentistId_preferredDate_idx" ON "AppointmentRequest"("dentistId", "preferredDate");

ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ClinicBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkingHour" ADD CONSTRAINT "WorkingHour_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicClosedDay" ADD CONSTRAINT "ClinicClosedDay_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicClosedDay" ADD CONSTRAINT "ClinicClosedDay_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ClinicBranch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClinicClosedDay" ADD CONSTRAINT "ClinicClosedDay_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WorkingHour" ("id", "clinicId", "dayOfWeek", "opensAt", "closesAt", "isClosed", "createdAt", "updatedAt")
SELECT
  'wh_' || MD5(clinic."id" || ':' || day.value::TEXT),
  clinic."id",
  day.value,
  '09:00',
  CASE WHEN day.value = 6 THEN '14:00' ELSE '18:00' END,
  day.value = 0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Clinic" AS clinic
CROSS JOIN GENERATE_SERIES(0, 6) AS day(value)
ON CONFLICT DO NOTHING;
