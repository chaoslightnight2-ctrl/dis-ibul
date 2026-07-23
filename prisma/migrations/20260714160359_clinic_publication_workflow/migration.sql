-- AlterTable
ALTER TABLE "ClinicApplication" ADD COLUMN     "clinicId" TEXT;

-- CreateIndex
CREATE INDEX "ClinicApplication_clinicId_idx" ON "ClinicApplication"("clinicId");

-- AddForeignKey
ALTER TABLE "ClinicApplication" ADD CONSTRAINT "ClinicApplication_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
