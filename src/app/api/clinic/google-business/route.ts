import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { decryptGoogleRefreshToken, getGoogleBusinessConfig, revokeGoogleBusinessToken } from "@/services/google/business-profile";

export async function DELETE(request: Request) {
  const blocked = await guardMutation(request, "google-business-disconnect", 4);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const oauth = await prisma.googleBusinessOauthConnection.findUnique({ where: { clinicId: access.clinic.id } });
  if (!oauth) return NextResponse.json({ disconnected: true });

  let revokedAtGoogle = false;
  const config = getGoogleBusinessConfig();
  if (config) {
    try {
      const refreshToken = decryptGoogleRefreshToken(oauth.refreshTokenEncrypted, access.clinic.id, config.encryptionKey);
      revokedAtGoogle = await revokeGoogleBusinessToken(refreshToken);
    } catch {
      revokedAtGoogle = false;
    }
  }

  await prisma.$transaction(async (tx) => {
    const google = await tx.googlePlaceConnection.findUnique({ where: { clinicId: access.clinic.id } });
    if (google) {
      await tx.googleReviewCache.deleteMany({ where: { connectionId: google.id } });
      if (!google.googlePlaceId) {
        await tx.googlePlaceConnection.delete({ where: { id: google.id } });
      } else {
        await tx.googlePlaceConnection.update({
          where: { id: google.id },
          data: {
            googleBusinessLocationId: null,
            googleRating: null,
            googleUserRatingsTotal: null,
            googleLastSyncedAt: null,
            googleSyncStatus: "NEVER_SYNCED",
            googleSyncError: null,
            googleConnectedByClinic: false,
            googleOauthConnectionId: null,
          },
        });
      }
    }
    await tx.googleBusinessOauthConnection.delete({ where: { id: oauth.id } });
    await tx.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "GOOGLE_BUSINESS_OAUTH_DISCONNECTED",
        target: `clinic:${access.clinic.id}`,
        metadata: { revokedAtGoogle },
      },
    });
  });
  return NextResponse.json({ disconnected: true, revokedAtGoogle });
}
