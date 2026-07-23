CREATE TYPE "PrivateFilePurpose" AS ENUM ('QUOTE_ATTACHMENT', 'VERIFICATION_DOCUMENT', 'DENTIST_CREDENTIAL');
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'INFECTED', 'ERROR');

CREATE TABLE "PrivateFile" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "quoteRequestId" TEXT,
  "purpose" "PrivateFilePurpose" NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
  "scanDetail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "PrivateFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivateFile_objectKey_key" ON "PrivateFile"("objectKey");
CREATE INDEX "PrivateFile_ownerId_createdAt_idx" ON "PrivateFile"("ownerId", "createdAt");
CREATE INDEX "PrivateFile_quoteRequestId_idx" ON "PrivateFile"("quoteRequestId");
CREATE INDEX "PrivateFile_scanStatus_expiresAt_idx" ON "PrivateFile"("scanStatus", "expiresAt");

ALTER TABLE "PrivateFile"
  ADD CONSTRAINT "PrivateFile_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PrivateFile"
  ADD CONSTRAINT "PrivateFile_quoteRequestId_fkey"
  FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
