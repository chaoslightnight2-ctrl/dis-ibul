import { NextRequest, NextResponse } from "next/server";
import { clinicSearchSchema } from "@/domain/validation";
import { guardMutation } from "@/lib/request-security";
import { searchClinics } from "@/services/search/clinic-search";

export async function GET(request: NextRequest) {
  const blocked = await guardMutation(request, "clinic-search", 30);
  if (blocked) return blocked;
  const params = request.nextUrl.searchParams;
  const parsed = clinicSearchSchema.safeParse({
    q: params.get("q") ?? undefined,
    city: params.get("city") ?? undefined,
    district: params.get("district") ?? undefined,
    treatment: params.get("treatment") ?? undefined,
    minPrice: params.get("minPrice") ?? undefined,
    maxPrice: params.get("maxPrice") ?? undefined,
    minGoogleRating: params.get("minGoogleRating") ?? undefined,
    minGoogleReviews: params.get("minGoogleReviews") ?? undefined,
    verifiedOnly: params.get("verifiedOnly") ?? undefined,
    openNow: params.get("openNow") ?? undefined,
    freeInitialExam: params.get("freeInitialExam") ?? undefined,
    maxExamFee: params.get("maxExamFee") ?? undefined,
    source: params.get("source") ?? undefined,
    sort: params.get("sort") ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  return NextResponse.json(
    { data: await searchClinics(parsed.data), filters: parsed.data },
    { headers: { "Cache-Control": "no-store" } },
  );
}
