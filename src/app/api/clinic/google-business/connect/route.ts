import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { buildGoogleBusinessAuthorizationUrl, getGoogleBusinessConfig } from "@/services/google/business-profile";
import { issueGoogleBusinessOauthState } from "@/services/google/oauth-state";

export async function GET(request: Request) {
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const config = getGoogleBusinessConfig();
  if (!config) return NextResponse.json({ error: "GOOGLE_BUSINESS_NOT_CONFIGURED" }, { status: 503 });

  try {
    const state = await issueGoogleBusinessOauthState(access.clinic.id, access.user.id);
    const response = NextResponse.redirect(buildGoogleBusinessAuthorizationUrl(config, state), 302);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "OAUTH_STATE_STORAGE_UNAVAILABLE" }, { status: 503 });
  }
}
