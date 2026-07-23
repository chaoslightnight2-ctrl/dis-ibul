-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "failureCode" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3);

UPDATE "Payment" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN "currentPeriodStart" TIMESTAMP(3),
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'IYZICO',
ADD COLUMN "providerCustomerId" TEXT,
ADD COLUMN "providerSubscriptionId" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3),
ALTER COLUMN "clinicId" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "startsAt" SET DEFAULT CURRENT_TIMESTAMP;

UPDATE "Subscription" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Subscription" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN "description" TEXT,
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "isPopular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "iyzicoPricingPlanRefCode" TEXT,
ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "SubscriptionPlan" ALTER COLUMN "features" DROP DEFAULT;

-- CreateTable
CREATE TABLE "BillingCheckout" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'IYZICO',
    "conversationId" TEXT NOT NULL,
    "token" TEXT,
    "checkoutFormContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "providerSubscriptionId" TEXT,
    "failureCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingWebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "subscriptionRef" TEXT,
    "orderRef" TEXT,
    "customerRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingCheckout_conversationId_key" ON "BillingCheckout"("conversationId");
CREATE UNIQUE INDEX "BillingCheckout_token_key" ON "BillingCheckout"("token");
CREATE INDEX "BillingCheckout_clinicId_status_createdAt_idx" ON "BillingCheckout"("clinicId", "status", "createdAt");
CREATE INDEX "BillingCheckout_userId_createdAt_idx" ON "BillingCheckout"("userId", "createdAt");
CREATE INDEX "BillingWebhookEvent_eventType_receivedAt_idx" ON "BillingWebhookEvent"("eventType", "receivedAt");
CREATE UNIQUE INDEX "BillingWebhookEvent_provider_providerEventId_key" ON "BillingWebhookEvent"("provider", "providerEventId");
CREATE UNIQUE INDEX "Payment_providerPaymentId_key" ON "Payment"("providerPaymentId");
CREATE INDEX "Payment_subscriptionId_createdAt_idx" ON "Payment"("subscriptionId", "createdAt");
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");
CREATE INDEX "Subscription_clinicId_status_idx" ON "Subscription"("clinicId", "status");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE UNIQUE INDEX "SubscriptionPlan_iyzicoPricingPlanRefCode_key" ON "SubscriptionPlan"("iyzicoPricingPlanRefCode");
CREATE INDEX "SubscriptionPlan_isActive_displayOrder_idx" ON "SubscriptionPlan"("isActive", "displayOrder");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCheckout" ADD CONSTRAINT "BillingCheckout_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCheckout" ADD CONSTRAINT "BillingCheckout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCheckout" ADD CONSTRAINT "BillingCheckout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
