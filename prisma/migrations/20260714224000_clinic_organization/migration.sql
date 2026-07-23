ALTER TABLE "ClinicBranch"
  ADD COLUMN "email" TEXT,
  ADD COLUMN "isMain" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "clinicId" ORDER BY "createdAt" ASC, "id" ASC) AS position
  FROM "ClinicBranch"
)
UPDATE "ClinicBranch" AS branch
SET "isMain" = true
FROM ranked
WHERE branch."id" = ranked."id" AND ranked.position = 1;

ALTER TABLE "ClinicTeamMember"
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Dentist"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ClinicTeamInvitation" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "acceptedById" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClinicTeamInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClinicTeamInvitation_tokenHash_key" ON "ClinicTeamInvitation"("tokenHash");
CREATE INDEX "ClinicTeamInvitation_clinicId_createdAt_idx" ON "ClinicTeamInvitation"("clinicId", "createdAt");
CREATE INDEX "ClinicTeamInvitation_email_expiresAt_idx" ON "ClinicTeamInvitation"("email", "expiresAt");

ALTER TABLE "ClinicTeamInvitation"
  ADD CONSTRAINT "ClinicTeamInvitation_clinicId_fkey"
  FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicTeamInvitation"
  ADD CONSTRAINT "ClinicTeamInvitation_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicTeamInvitation"
  ADD CONSTRAINT "ClinicTeamInvitation_acceptedById_fkey"
  FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
