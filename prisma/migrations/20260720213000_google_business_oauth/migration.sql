ALTER TABLE "GooglePlaceConnection"
ALTER COLUMN "googlePlaceId" DROP NOT NULL;

CREATE UNIQUE INDEX "GooglePlaceConnection_googleBusinessLocationId_key"
ON "GooglePlaceConnection"("googleBusinessLocationId");

ALTER TABLE "GoogleReviewCache"
ADD COLUMN "sourceReviewId" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "GoogleReviewCache_connectionId_publishedAt_idx"
ON "GoogleReviewCache"("connectionId", "publishedAt");

CREATE TABLE "GoogleBusinessOauthConnection" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "connectedByUserId" TEXT NOT NULL,
  "refreshTokenEncrypted" TEXT NOT NULL,
  "scopes" TEXT[],
  "googleAccountName" TEXT,
  "googleLocationName" TEXT,
  "googleLocationTitle" TEXT,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSyncedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "GoogleBusinessOauthConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GoogleBusinessOauthConnection_clinicId_key"
ON "GoogleBusinessOauthConnection"("clinicId");

CREATE INDEX "GoogleBusinessOauthConnection_connectedByUserId_idx"
ON "GoogleBusinessOauthConnection"("connectedByUserId");

CREATE INDEX "GoogleBusinessOauthConnection_revokedAt_idx"
ON "GoogleBusinessOauthConnection"("revokedAt");

ALTER TABLE "GoogleBusinessOauthConnection"
ADD CONSTRAINT "GoogleBusinessOauthConnection_clinicId_fkey"
FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "GoogleBusinessOauthConnection"
ADD CONSTRAINT "GoogleBusinessOauthConnection_connectedByUserId_fkey"
FOREIGN KEY ("connectedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
