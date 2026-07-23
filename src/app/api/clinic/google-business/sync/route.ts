import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { guardMutation } from "@/lib/request-security";
import {
  getAuthorizedGoogleBusinessLocations,
  googleBusinessErrorResponse,
  recordGoogleBusinessSyncFailure,
  syncGoogleBusinessLocation,
} from "@/services/google/business-profile-connection";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "google-business-sync", 10);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  try {
    const authorized = await getAuthorizedGoogleBusinessLocations(access.clinic.id);
    const selected = authorized.oauth.googleLocationName;
    const location = authorized.locations.find((item) => item.resourceName === selected);
    if (!location) return NextResponse.json({ error: "CONNECTED_LOCATION_NOT_AUTHORIZED" }, { status: 409 });
    const result = await syncGoogleBusinessLocation({
      clinicId: access.clinic.id,
      actorId: access.user.id,
      location,
      accessToken: authorized.accessToken,
    });
    return NextResponse.json({ synced: true, ...result });
  } catch (error) {
    await recordGoogleBusinessSyncFailure(access.clinic.id, error);
    const result = googleBusinessErrorResponse(error);
    return NextResponse.json({ error: result.code }, { status: result.status });
  }
}
