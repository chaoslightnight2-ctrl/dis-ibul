import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  decryptGoogleRefreshToken,
  getGoogleBusinessConfig,
  GoogleBusinessProfileError,
  listGoogleBusinessLocations,
  listGoogleBusinessReviews,
  refreshGoogleBusinessAccessToken,
  type GoogleBusinessLocation,
} from "@/services/google/business-profile";

export async function getGoogleBusinessAccess(clinicId: string) {
  const config = getGoogleBusinessConfig();
  if (!config) throw new GoogleBusinessProfileError("GOOGLE_BUSINESS_NOT_CONFIGURED", 503);
  const oauth = await prisma.googleBusinessOauthConnection.findFirst({
    where: { clinicId, revokedAt: null },
  });
  if (!oauth) throw new GoogleBusinessProfileError("GOOGLE_BUSINESS_NOT_CONNECTED", 404);
  const refreshToken = decryptGoogleRefreshToken(oauth.refreshTokenEncrypted, clinicId, config.encryptionKey);
  const token = await refreshGoogleBusinessAccessToken(config, refreshToken);
  return { oauth, accessToken: token.access_token, refreshToken };
}

export async function getAuthorizedGoogleBusinessLocations(clinicId: string) {
  const access = await getGoogleBusinessAccess(clinicId);
  const locations = await listGoogleBusinessLocations(access.accessToken);
  return { ...access, locations };
}

export async function syncGoogleBusinessLocation(args: {
  clinicId: string;
  actorId: string;
  location: GoogleBusinessLocation;
  accessToken: string;
}) {
  const { clinicId, actorId, location, accessToken } = args;
  const reviewData = await listGoogleBusinessReviews(accessToken, location.resourceName);
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const oauth = await tx.googleBusinessOauthConnection.update({
        where: { clinicId },
        data: {
          googleAccountName: location.accountName,
          googleLocationName: location.resourceName,
          googleLocationTitle: location.title,
          lastSyncedAt: now,
          lastError: null,
          revokedAt: null,
        },
      });
      const connection = await tx.googlePlaceConnection.upsert({
        where: { clinicId },
        update: {
          googleBusinessLocationId: location.resourceName,
          googleRating: reviewData.rating,
          googleUserRatingsTotal: reviewData.reviewCount,
          googleMapsUrl: location.mapsUrl,
          googleWriteReviewUrl: location.writeReviewUrl,
          googleLastSyncedAt: now,
          googleSyncStatus: "OK",
          googleSyncError: null,
          googleConnectedByClinic: true,
          googleOauthConnectionId: oauth.id,
        },
        create: {
          clinicId,
          googleBusinessLocationId: location.resourceName,
          googleRating: reviewData.rating,
          googleUserRatingsTotal: reviewData.reviewCount,
          googleMapsUrl: location.mapsUrl,
          googleWriteReviewUrl: location.writeReviewUrl,
          googleLastSyncedAt: now,
          googleSyncStatus: "OK",
          googleConnectedByClinic: true,
          googleOauthConnectionId: oauth.id,
        },
      });
      await tx.googleReviewCache.deleteMany({ where: { connectionId: connection.id } });
      if (reviewData.reviews.length) {
        await tx.googleReviewCache.createMany({
          data: reviewData.reviews.map((review) => ({
            connectionId: connection.id,
            sourceReviewId: review.sourceReviewId,
            authorDisplayName: review.authorDisplayName,
            rating: review.rating,
            text: review.text,
            clinicResponse: review.clinicResponse,
            sourceUrl: location.mapsUrl,
            publishedAt: review.publishedAt,
            fetchedAt: now,
          })),
        });
      }
      await tx.auditLog.create({
        data: {
          actorId,
          action: "GOOGLE_BUSINESS_REVIEWS_SYNCED",
          target: `clinic:${clinicId}`,
          metadata: {
            googleLocation: location.resourceName,
            reviewCount: reviewData.reviewCount,
            cachedReviewCount: reviewData.reviews.length,
          },
        },
      });
      return { reviewCount: reviewData.reviewCount, cachedReviewCount: reviewData.reviews.length };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new GoogleBusinessProfileError("LOCATION_ALREADY_CONNECTED", 409);
    }
    throw error;
  }
}

export async function recordGoogleBusinessSyncFailure(clinicId: string, error: unknown) {
  const message = error instanceof GoogleBusinessProfileError ? error.code : "SYNC_FAILED";
  await Promise.all([
    prisma.googleBusinessOauthConnection.updateMany({ where: { clinicId }, data: { lastError: message } }),
    prisma.googlePlaceConnection.updateMany({
      where: { clinicId, googleConnectedByClinic: true },
      data: { googleSyncStatus: "FAILED", googleSyncError: message },
    }),
  ]).catch(() => undefined);
}

export function googleBusinessErrorResponse(error: unknown) {
  if (error instanceof GoogleBusinessProfileError) {
    return { status: error.status, code: error.code };
  }
  return { status: 502, code: "GOOGLE_BUSINESS_OPERATION_FAILED" };
}
