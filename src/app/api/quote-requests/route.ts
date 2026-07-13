import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/domain/validation";

export async function POST(request: Request) {
  const payload = quoteRequestSchema.safeParse(await request.json());
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", issues: payload.error.issues }, { status: 400 });
  }

  return NextResponse.json({
    status: "PENDING",
    privacy: "Seçilen her kliniğe ayrı talep oluşturulacaktır; klinikler birbirinin teklifini göremez.",
    data: payload.data,
  }, { status: 202 });
}
