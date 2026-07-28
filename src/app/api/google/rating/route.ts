import { NextRequest, NextResponse } from "next/server";

/**
 * Geriye uyumluluk endpoint'i.
 *
 * Anahtarsız mod Google sayfalarını taramaz. Eski istemciler bu endpoint'i
 * çağırsa bile boş ve başarılı bir yanıt alır; arayüz normal Google Maps arama
 * bağlantısını göstermeye devam eder.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const city = request.nextUrl.searchParams.get("city");

  if (!name || !city) {
    return NextResponse.json({ error: "name ve city parametreleri gerekli" }, { status: 400 });
  }

  if (name.length > 200 || city.length > 100) {
    return NextResponse.json({ error: "Parametre çok uzun" }, { status: 400 });
  }

  return NextResponse.json({
    rating: null,
    reviewCount: null,
    sourceUrl: null,
    provider: "google-free-fallback",
  });
}
