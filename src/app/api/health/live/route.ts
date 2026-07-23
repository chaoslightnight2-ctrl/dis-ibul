import { NextResponse } from "next/server";
import { brand } from "@/config/brand";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: brand.name,
      version: process.env.DEPLOYMENT_VERSION || "local",
      time: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
