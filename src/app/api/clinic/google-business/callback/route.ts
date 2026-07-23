import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";
import {
  encryptGoogleRefreshToken,
  exchangeGoogleBusinessCode,
  getGoogleBusinessConfig,
} from "@/services/google/business-profile";
import { consumeGoogleBusinessOauthState } from "@/services/google/oauth-state";

function panelRedirect(request: Request, result: string) {
  const base = process.env.APP_BASE_URL || request.url;
  return NextResponse.redirect(new URL(`/panel/klinik?google=${encodeURIComponent(result)}`, base), 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = getGoogleBusinessConfig();
  if (!config) return panelRedirect(request, "configuration-missing");
  if (url.searchParams.get("error")) return panelRedirect(request, "denied");
  const code = url.searchParams.get("code");
  const stateValue = url.searchParams.get("state");
  if (!code || !stateValue) return panelRedirect(request, "invalid-state");

  const user = await getRequestUser(request);
  if (!user) return panelRedirect(request, "session-expired");

  try {
    const state = await consumeGoogleBusinessOauthState(stateValue);
    if (!state || state.userId !== user.id) return panelRedirect(request, "invalid-state");
    const membership = await prisma.clinicTeamMember.findFirst({
      where: { clinicId: state.clinicId, userId: user.id, role: "CLINIC_MANAGER" },
      select: { id: true },
    });
    if (!membership) return panelRedirect(request, "unauthorized");

    const token = await exchangeGoogleBusinessCode(config, code);
    const existing = await prisma.googleBusinessOauthConnection.findUnique({ where: { clinicId: state.clinicId } });
    const encryptedToken = token.refresh_token
      ? encryptGoogleRefreshToken(token.refresh_token, state.clinicId, config.encryptionKey)
      : existing?.refreshTokenEncrypted;
    if (!encryptedToken) return panelRedirect(request, "refresh-token-missing");
    const scopes = (token.scope || "https://www.googleapis.com/auth/business.manage").split(/\s+/).filter(Boolean);

    await prisma.$transaction([
      prisma.googleBusinessOauthConnection.upsert({
        where: { clinicId: state.clinicId },
        update: {
          connectedByUserId: user.id,
          refreshTokenEncrypted: encryptedToken,
          scopes,
          connectedAt: new Date(),
          lastError: null,
          revokedAt: null,
        },
        create: {
          clinicId: state.clinicId,
          connectedByUserId: user.id,
          refreshTokenEncrypted: encryptedToken,
          scopes,
        },
      }),
      prisma.auditLog.create({
        data: { actorId: user.id, action: "GOOGLE_BUSINESS_OAUTH_CONNECTED", target: `clinic:${state.clinicId}` },
      }),
    ]);
    return panelRedirect(request, "connected");
  } catch {
    return panelRedirect(request, "connection-failed");
  }
}
