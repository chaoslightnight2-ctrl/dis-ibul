import { NextResponse } from "next/server";
import { appointmentRequestSchema } from "@/domain/validation";

export async function POST(request: Request) {
  const payload = appointmentRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: payload.error.issues }, { status: 400 });
  }

  return NextResponse.json({
    status: "PENDING",
    message: "Randevu talebi doğrulandı. Kalıcı kayıt repository katmanı Faz 2'de bağlanacak.",
    data: payload.data,
  }, { status: 202 });
}
