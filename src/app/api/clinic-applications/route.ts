import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    error: "CLINIC_APPLICATIONS_DISABLED",
    message: "DişçiBul şu anda klinik başvurusu almıyor; klinikler harita ve açık veri kaynaklarından listelenir.",
  }, { status: 410 });
}
