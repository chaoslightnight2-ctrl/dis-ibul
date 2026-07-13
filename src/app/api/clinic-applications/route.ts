import { NextResponse } from "next/server";
import { clinicApplicationSchema } from "@/domain/validation";

export async function POST(request: Request) {
  const payload = clinicApplicationSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: payload.error.issues }, { status: 400 });
  }

  return NextResponse.json({
    status: "PENDING_SUBMISSION",
    applicationId: `demo-clinic-app-${Date.now()}`,
    nextSteps: [
      "E-posta ve telefon doğrulaması",
      "Vergi/işletme belgesi yükleme",
      "Google işletme profili eşleştirme",
      "Tedavi ve fiyat bilgisi moderasyon kontrolü",
    ],
    data: payload.data,
  }, { status: 202 });
}
