import { NextResponse } from "next/server";
import { getRuntimeHealth } from "@/services/health/runtime-health";

export async function GET() {
  const health = await getRuntimeHealth();
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
