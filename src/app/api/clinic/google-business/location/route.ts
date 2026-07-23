import { NextResponse } from "next/server";
import { z } from "zod";
import { getClinicAccess } from "@/lib/clinic-access";
import { guardMutation, readJson } from "@/lib/request-security";
import {
  getAuthorizedGoogleBusinessLocations,
  googleBusinessErrorResponse,
  recordGoogleBusinessSyncFailure,
  syncGoogleBusinessLocation,
} from "@/services/google/business-profile-connection";

const locationSelectionSchema = z.object({ resourceName: z.string().regex(/^accounts\/[^/]+\/locations\/[^/]+$/) });

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "google-business-location", 10);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = locationSelectionSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  try {
    const authorized = await getAuthorizedGoogleBusinessLocations(access.clinic.id);
    const location = authorized.locations.find((item) => item.resourceName === payload.data.resourceName);
    if (!location) return NextResponse.json({ error: "LOCATION_NOT_AUTHORIZED" }, { status: 403 });
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
