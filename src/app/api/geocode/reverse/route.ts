import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation } from "@/lib/request-security";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

const responseSchema = z.object({
  address: z.record(z.string(), z.string()).default({}),
});

export async function GET(request: NextRequest) {
  const blocked = await guardMutation(request, "reverse-geocode", 20);
  if (blocked) return blocked;

  const parsed = querySchema.safeParse({
    lat: request.nextUrl.searchParams.get("lat"),
    lon: request.nextUrl.searchParams.get("lon"),
  });
  if (!parsed.success) return NextResponse.json({ error: "INVALID_COORDINATES" }, { status: 400 });

  const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
  endpoint.searchParams.set("format", "jsonv2");
  endpoint.searchParams.set("lat", String(parsed.data.lat));
  endpoint.searchParams.set("lon", String(parsed.data.lon));
  endpoint.searchParams.set("accept-language", "tr");
  endpoint.searchParams.set("zoom", "10");

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "application/json",
        Referer: process.env.APP_BASE_URL || "https://dis-ibul.vercel.app",
        "User-Agent": `Discibul/0.5 (${process.env.APP_BASE_URL || "https://dis-ibul.vercel.app"})`,
      },
    });
    if (!response.ok) return NextResponse.json({ error: "GEOCODER_UNAVAILABLE" }, { status: 502 });

    const data = responseSchema.safeParse(await response.json());
    if (!data.success) return NextResponse.json({ error: "INVALID_GEOCODER_RESPONSE" }, { status: 502 });
    const address = data.data.address;
    const city = address.province || address.city || address.state || address.region || "";
    const district = address.town || address.suburb || address.county || address.district || "";
    if (!city) return NextResponse.json({ error: "CITY_NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ city, district }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "GEOCODER_UNAVAILABLE" }, { status: 503 });
  }
}
