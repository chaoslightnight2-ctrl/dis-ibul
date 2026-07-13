import { NextRequest, NextResponse } from "next/server";
import { clinicSearchSchema } from "@/domain/validation";
import { searchClinics } from "@/services/search/clinic-search";

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = clinicSearchSchema.parse({
    q: params.get("q") ?? undefined,
    city: params.get("city") ?? undefined,
    district: params.get("district") ?? undefined,
    treatment: params.get("treatment") ?? undefined,
    minPrice: params.get("minPrice") ?? undefined,
    maxPrice: params.get("maxPrice") ?? undefined,
    minGoogleRating: params.get("minGoogleRating") ?? undefined,
    verifiedOnly: params.get("verifiedOnly") ?? undefined,
    openNow: params.get("openNow") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });

  return NextResponse.json({ data: searchClinics(filters), filters });
}
