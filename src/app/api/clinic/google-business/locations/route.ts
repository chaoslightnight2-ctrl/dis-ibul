import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { getAuthorizedGoogleBusinessLocations, googleBusinessErrorResponse } from "@/services/google/business-profile-connection";

export async function GET(request: Request) {
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  try {
    const { locations } = await getAuthorizedGoogleBusinessLocations(access.clinic.id);
    return NextResponse.json({ locations }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const result = googleBusinessErrorResponse(error);
    return NextResponse.json({ error: result.code }, { status: result.status });
  }
}
