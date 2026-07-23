-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('VISITOR', 'PATIENT', 'DENTIST', 'CLINIC_MANAGER', 'MODERATOR', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT', 'PENDING_SUBMISSION', 'IN_REVIEW', 'ADDITIONAL_DOCUMENT_REQUIRED', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'VIEWED_BY_CLINIC', 'INFO_REQUESTED', 'APPROVED', 'ALTERNATIVE_TIME_PROPOSED', 'PATIENT_CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GoogleSyncStatus" AS ENUM ('NEVER_SYNCED', 'OK', 'FAILED', 'RATE_LIMITED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PATIENT',
    "emailVerifiedAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'tr',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "healthDataConsentAt" TIMESTAMP(3),
    "notificationPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "foundingYear" INTEGER,
    "logoUrl" TEXT,
    "coverImageUrl" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "website" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isSponsored" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "emergencyService" BOOLEAN NOT NULL DEFAULT false,
    "wheelchairAccess" BOOLEAN NOT NULL DEFAULT false,
    "parking" BOOLEAN NOT NULL DEFAULT false,
    "onlineConsultation" BOOLEAN NOT NULL DEFAULT false,
    "childFriendly" BOOLEAN NOT NULL DEFAULT false,
    "sedation" BOOLEAN NOT NULL DEFAULT false,
    "generalAnesthesia" BOOLEAN NOT NULL DEFAULT false,
    "firstExamFee" DECIMAL(12,2),
    "freeInitialExam" BOOLEAN NOT NULL DEFAULT false,
    "initialExamIncludes" TEXT[],
    "languages" TEXT[],
    "paymentOptions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicBranch" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicTeamMember" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLINIC_MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dentist" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clinicId" TEXT,
    "fullName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "photoUrl" TEXT,
    "university" TEXT,
    "graduationYear" INTEGER,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "about" TEXT,
    "languages" TEXT[],
    "acceptsChildren" BOOLEAN NOT NULL DEFAULT false,
    "acceptsInternationalPatients" BOOLEAN NOT NULL DEFAULT false,
    "onlineConsultation" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "googlePlaceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dentist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentistEducation" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "degree" TEXT,
    "year" INTEGER,

    CONSTRAINT "DentistEducation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentistCertificate" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT,
    "year" INTEGER,
    "fileKey" TEXT,

    CONSTRAINT "DentistCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentistSpecialty" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "specialtyId" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "DentistSpecialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,

    CONSTRAINT "TreatmentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "specialtyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "averageSessions" INTEGER,
    "estimatedDuration" TEXT,
    "pricingUnit" TEXT NOT NULL,
    "supportsStartingPrice" BOOLEAN NOT NULL DEFAULT true,
    "supportsMinMax" BOOLEAN NOT NULL DEFAULT true,
    "patientInfoText" TEXT,
    "riskWarning" TEXT,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicTreatment" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ClinicTreatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPrice" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "branchId" TEXT,
    "treatmentId" TEXT NOT NULL,
    "dentistId" TEXT,
    "minPrice" DECIMAL(12,2),
    "maxPrice" DECIMAL(12,2),
    "fixedPrice" DECIMAL(12,2),
    "campaignPrice" DECIMAL(12,2),
    "normalPrice" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "priceUnit" TEXT NOT NULL,
    "vatIncluded" BOOLEAN NOT NULL DEFAULT true,
    "examIncluded" BOOLEAN NOT NULL DEFAULT false,
    "imagingIncluded" BOOLEAN NOT NULL DEFAULT false,
    "materialOrBrand" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "packageContent" TEXT,
    "extraFeeConditions" TEXT,
    "description" TEXT,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreatmentPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreatmentPackage" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "treatmentId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'TRY',

    CONSTRAINT "TreatmentPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicPhoto" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,

    CONSTRAINT "ClinicPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentistPhoto" (
    "id" TEXT NOT NULL,
    "dentistId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,

    CONSTRAINT "DentistPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseGallery" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "beforeKey" TEXT,
    "afterKey" TEXT,

    CONSTRAINT "CaseGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseGalleryConsent" (
    "id" TEXT NOT NULL,
    "caseGalleryId" TEXT NOT NULL,
    "consentKey" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseGalleryConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GooglePlaceConnection" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "googlePlaceId" TEXT NOT NULL,
    "googleBusinessLocationId" TEXT,
    "googleRating" DECIMAL(2,1),
    "googleUserRatingsTotal" INTEGER,
    "googleMapsUrl" TEXT,
    "googleWriteReviewUrl" TEXT,
    "googleLastSyncedAt" TIMESTAMP(3),
    "googleSyncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'NEVER_SYNCED',
    "googleSyncError" TEXT,
    "googleMatchConfidence" DECIMAL(3,2),
    "googleConnectedByClinic" BOOLEAN NOT NULL DEFAULT false,
    "googleOauthConnectionId" TEXT,

    CONSTRAINT "GooglePlaceConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleReviewCache" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "authorDisplayName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "relativeTime" TEXT,
    "text" TEXT,
    "clinicResponse" TEXT,
    "sourceUrl" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleReviewCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonItem" (
    "id" TEXT NOT NULL,
    "comparisonListId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComparisonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clinicId" TEXT NOT NULL,
    "dentistId" TEXT,
    "treatmentName" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "note" TEXT,
    "kvkkConsent" BOOLEAN NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentStatusHistory" (
    "id" TEXT NOT NULL,
    "appointmentRequestId" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "treatmentName" TEXT NOT NULL,
    "complaint" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "budgetMin" DECIMAL(12,2),
    "budgetMax" DECIMAL(12,2),
    "hasPriorExam" BOOLEAN NOT NULL DEFAULT false,
    "hasImaging" BOOLEAN NOT NULL DEFAULT false,
    "contactPreference" TEXT NOT NULL,
    "kvkkConsent" BOOLEAN NOT NULL,
    "healthDataConsent" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "clinicName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "specialties" TEXT[],
    "firstExamFee" DECIMAL(12,2) NOT NULL,
    "freeInitialExam" BOOLEAN NOT NULL DEFAULT false,
    "googlePlaceId" TEXT,
    "kvkkConsent" BOOLEAN NOT NULL,
    "moderationConsent" BOOLEAN NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequestClinic" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,

    CONSTRAINT "QuoteRequestClinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteResponse" (
    "id" TEXT NOT NULL,
    "quoteRequestClinicId" TEXT NOT NULL,
    "estimatedMinPrice" DECIMAL(12,2),
    "estimatedMaxPrice" DECIMAL(12,2),
    "includedItems" TEXT,
    "estimatedSessions" INTEGER,
    "estimatedDuration" TEXT,
    "firstAvailableDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationApplication" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING_SUBMISSION',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "verificationApplicationId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "privateObjectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "target" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "clinicId" TEXT,
    "status" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'TRY',
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT,
    "type" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT,
    "city" TEXT,
    "district" TEXT,
    "filters" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" TEXT NOT NULL,
    "consentVersion" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiCredential" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "keyRef" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BackgroundJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackgroundJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "Verification_expiresAt_idx" ON "Verification"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientProfile_userId_key" ON "PatientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");

-- CreateIndex
CREATE INDEX "Clinic_slug_idx" ON "Clinic"("slug");

-- CreateIndex
CREATE INDEX "Clinic_city_district_idx" ON "Clinic"("city", "district");

-- CreateIndex
CREATE INDEX "Clinic_verificationStatus_isPublished_idx" ON "Clinic"("verificationStatus", "isPublished");

-- CreateIndex
CREATE INDEX "Clinic_createdAt_idx" ON "Clinic"("createdAt");

-- CreateIndex
CREATE INDEX "ClinicBranch_clinicId_idx" ON "ClinicBranch"("clinicId");

-- CreateIndex
CREATE INDEX "ClinicBranch_city_district_idx" ON "ClinicBranch"("city", "district");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicTeamMember_clinicId_userId_key" ON "ClinicTeamMember"("clinicId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dentist_slug_key" ON "Dentist"("slug");

-- CreateIndex
CREATE INDEX "Dentist_slug_idx" ON "Dentist"("slug");

-- CreateIndex
CREATE INDEX "Dentist_verificationStatus_idx" ON "Dentist"("verificationStatus");

-- CreateIndex
CREATE INDEX "Dentist_clinicId_idx" ON "Dentist"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_slug_key" ON "Specialty"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "DentistSpecialty_dentistId_specialtyId_key" ON "DentistSpecialty"("dentistId", "specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "TreatmentCategory_slug_key" ON "TreatmentCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Treatment_slug_key" ON "Treatment"("slug");

-- CreateIndex
CREATE INDEX "Treatment_categoryId_idx" ON "Treatment"("categoryId");

-- CreateIndex
CREATE INDEX "Treatment_specialtyId_idx" ON "Treatment"("specialtyId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicTreatment_clinicId_treatmentId_key" ON "ClinicTreatment"("clinicId", "treatmentId");

-- CreateIndex
CREATE INDEX "TreatmentPrice_clinicId_idx" ON "TreatmentPrice"("clinicId");

-- CreateIndex
CREATE INDEX "TreatmentPrice_treatmentId_idx" ON "TreatmentPrice"("treatmentId");

-- CreateIndex
CREATE INDEX "TreatmentPrice_minPrice_maxPrice_fixedPrice_idx" ON "TreatmentPrice"("minPrice", "maxPrice", "fixedPrice");

-- CreateIndex
CREATE INDEX "TreatmentPrice_moderationStatus_idx" ON "TreatmentPrice"("moderationStatus");

-- CreateIndex
CREATE INDEX "TreatmentPrice_updatedAt_idx" ON "TreatmentPrice"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseGalleryConsent_caseGalleryId_key" ON "CaseGalleryConsent"("caseGalleryId");

-- CreateIndex
CREATE UNIQUE INDEX "GooglePlaceConnection_clinicId_key" ON "GooglePlaceConnection"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "GooglePlaceConnection_googlePlaceId_key" ON "GooglePlaceConnection"("googlePlaceId");

-- CreateIndex
CREATE INDEX "GooglePlaceConnection_googlePlaceId_idx" ON "GooglePlaceConnection"("googlePlaceId");

-- CreateIndex
CREATE INDEX "GooglePlaceConnection_googleRating_idx" ON "GooglePlaceConnection"("googleRating");

-- CreateIndex
CREATE INDEX "GooglePlaceConnection_googleUserRatingsTotal_idx" ON "GooglePlaceConnection"("googleUserRatingsTotal");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_clinicId_key" ON "Favorite"("userId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ComparisonItem_comparisonListId_clinicId_key" ON "ComparisonItem"("comparisonListId", "clinicId");

-- CreateIndex
CREATE INDEX "ClinicApplication_email_idx" ON "ClinicApplication"("email");

-- CreateIndex
CREATE INDEX "ClinicApplication_status_createdAt_idx" ON "ClinicApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequestClinic_quoteRequestId_clinicId_key" ON "QuoteRequestClinic"("quoteRequestId", "clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteResponse_quoteRequestClinicId_key" ON "QuoteResponse"("quoteRequestClinicId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_slug_key" ON "SubscriptionPlan"("slug");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicBranch" ADD CONSTRAINT "ClinicBranch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicTeamMember" ADD CONSTRAINT "ClinicTeamMember_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicTeamMember" ADD CONSTRAINT "ClinicTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dentist" ADD CONSTRAINT "Dentist_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentistEducation" ADD CONSTRAINT "DentistEducation_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentistCertificate" ADD CONSTRAINT "DentistCertificate_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentistSpecialty" ADD CONSTRAINT "DentistSpecialty_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentistSpecialty" ADD CONSTRAINT "DentistSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentCategory" ADD CONSTRAINT "TreatmentCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TreatmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TreatmentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicTreatment" ADD CONSTRAINT "ClinicTreatment_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicTreatment" ADD CONSTRAINT "ClinicTreatment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPrice" ADD CONSTRAINT "TreatmentPrice_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPrice" ADD CONSTRAINT "TreatmentPrice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ClinicBranch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPrice" ADD CONSTRAINT "TreatmentPrice_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPrice" ADD CONSTRAINT "TreatmentPrice_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPackage" ADD CONSTRAINT "TreatmentPackage_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreatmentPackage" ADD CONSTRAINT "TreatmentPackage_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicPhoto" ADD CONSTRAINT "ClinicPhoto_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentistPhoto" ADD CONSTRAINT "DentistPhoto_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseGallery" ADD CONSTRAINT "CaseGallery_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseGalleryConsent" ADD CONSTRAINT "CaseGalleryConsent_caseGalleryId_fkey" FOREIGN KEY ("caseGalleryId") REFERENCES "CaseGallery"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GooglePlaceConnection" ADD CONSTRAINT "GooglePlaceConnection_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleReviewCache" ADD CONSTRAINT "GoogleReviewCache_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "GooglePlaceConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonList" ADD CONSTRAINT "ComparisonList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonItem" ADD CONSTRAINT "ComparisonItem_comparisonListId_fkey" FOREIGN KEY ("comparisonListId") REFERENCES "ComparisonList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonItem" ADD CONSTRAINT "ComparisonItem_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_dentistId_fkey" FOREIGN KEY ("dentistId") REFERENCES "Dentist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentStatusHistory" ADD CONSTRAINT "AppointmentStatusHistory_appointmentRequestId_fkey" FOREIGN KEY ("appointmentRequestId") REFERENCES "AppointmentRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicApplication" ADD CONSTRAINT "ClinicApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestClinic" ADD CONSTRAINT "QuoteRequestClinic_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestClinic" ADD CONSTRAINT "QuoteRequestClinic_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteResponse" ADD CONSTRAINT "QuoteResponse_quoteRequestClinicId_fkey" FOREIGN KEY ("quoteRequestClinicId") REFERENCES "QuoteRequestClinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationApplication" ADD CONSTRAINT "VerificationApplication_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerificationDocument_verificationApplicationId_fkey" FOREIGN KEY ("verificationApplicationId") REFERENCES "VerificationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
