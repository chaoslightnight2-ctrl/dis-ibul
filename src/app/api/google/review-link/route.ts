import { NextRequest, NextResponse } from "next/server";
import { getGoogleProvider } from "@/services/google/provider";

export async function GET(request: NextRequest) {
  const clinicSlug = request.nextUrl.searchParams.get("clinicSlug");
  if (!clinicSlug) {
    return NextResponse.json({ error: "clinicSlug is required" }, { status: 400 });
  }

  const url = await getGoogleProvider().getWriteReviewUrl(clinicSlug);
  if (!url) {
    return NextResponse.json({ error: "Google yorum bağlantısı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json({
    url,
    reviewPrefix: "DişçiBul üzerinden gönderildi: ",
    note: "Yorum Google üzerinde yazılır ve gönderilir. Platform yorumu otomatik göndermez veya yerel puan üretmez.",
  });
}
