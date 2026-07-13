import { NextResponse } from "next/server";
import { brand } from "@/config/brand";
import { env } from "@/config/env";

export function GET() {
  return NextResponse.json({
    ok: true,
    brand: brand.name,
    googleProvider: env.GOOGLE_PROVIDER,
    time: new Date().toISOString(),
  });
}
