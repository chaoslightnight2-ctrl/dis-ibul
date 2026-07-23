-- Remove legacy conversations that cannot be assigned to an authenticated patient.
DELETE FROM "Conversation" WHERE "userId" IS NULL;

-- Merge duplicate patient-clinic threads without dropping their messages.
WITH ranked AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "clinicId", "userId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS "canonicalId"
  FROM "Conversation"
)
UPDATE "Message" AS message
SET "conversationId" = ranked."canonicalId"
FROM ranked
WHERE message."conversationId" = ranked."id"
  AND ranked."id" <> ranked."canonicalId";

WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "clinicId", "userId"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS position
  FROM "Conversation"
)
DELETE FROM "Conversation" AS conversation
USING ranked
WHERE conversation."id" = ranked."id"
  AND ranked.position > 1;

ALTER TABLE "Conversation"
  ALTER COLUMN "userId" SET NOT NULL,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);
ALTER TABLE "Notification" ADD COLUMN "href" TEXT;

ALTER TABLE "Conversation"
  ADD CONSTRAINT "Conversation_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Conversation_clinicId_userId_key" ON "Conversation"("clinicId", "userId");
CREATE INDEX "Conversation_clinicId_updatedAt_idx" ON "Conversation"("clinicId", "updatedAt");
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");
CREATE INDEX "Message_conversationId_readAt_idx" ON "Message"("conversationId", "readAt");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- Make existing authenticated appointment and quote relationships immediately messageable.
INSERT INTO "Conversation" ("id", "clinicId", "userId", "createdAt", "updatedAt")
SELECT
  'conv_' || MD5(source."clinicId" || ':' || source."userId"),
  source."clinicId",
  source."userId",
  MIN(source."createdAt"),
  CURRENT_TIMESTAMP
FROM (
  SELECT appointment."clinicId", appointment."userId", appointment."createdAt"
  FROM "AppointmentRequest" AS appointment
  WHERE appointment."userId" IS NOT NULL
  UNION ALL
  SELECT selected."clinicId", quote."userId", quote."createdAt"
  FROM "QuoteRequestClinic" AS selected
  INNER JOIN "QuoteRequest" AS quote ON quote."id" = selected."quoteRequestId"
  WHERE quote."userId" IS NOT NULL
) AS source
GROUP BY source."clinicId", source."userId"
ON CONFLICT ("clinicId", "userId") DO NOTHING;
