import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  clinics: z.array(z.tuple([
    z.string().trim().min(1).max(200),
    z.string().trim().min(1).max(100),
  ])).max(50),
});

/**
 * Geriye uyumluluk için anahtarsız toplu endpoint.
 * Google Maps DOM'u veya gizli endpoint'leri çağırmadan her kayıt için null
 * döner. Böylece eski istemciler bozulmaz ve gerçek olmayan puan gösterilmez.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success || parsed.data.clinics.length === 0) {
    return NextResponse.json({ error: "Geçerli clinics dizisi gerekli" }, { status: 400 });
  }

  const results = Object.fromEntries(
    parsed.data.clinics.map(([name, city]) => [`${name}|${city}`, null]),
  );

  return NextResponse.json({ results, provider: "google-free-fallback" });
}
