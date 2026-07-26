import { NextRequest, NextResponse } from "next/server";
import { fetchGoogleRating } from "@/services/google/ratings";
import { logEvent } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const city = request.nextUrl.searchParams.get("city");

  if (!name || !city) {
    return NextResponse.json({ error: "name ve city parametreleri gerekli" }, { status: 400 });
  }

  if (name.length > 200 || city.length > 100) {
    return NextResponse.json({ error: "Parametre çok uzun" }, { status: 400 });
  }

  try {
    // 30sn timeout — asla sonsuza kadar bekleme
    const result = await Promise.race([
      fetchGoogleRating(name, city),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("RATING_TIMEOUT")), 30_000),
      ),
    ]).catch((err) => {
      if (err?.message === "RATING_TIMEOUT") {
        logEvent("warn", "google_rating_timeout", { name, city });
        return null;
      }
      throw err;
    });
    return NextResponse.json(result ?? { rating: null, reviewCount: null, sourceUrl: null });
  } catch (error) {
    logEvent("error", "google_rating_api_error", { name, city, error: String(error) });
    return NextResponse.json({ rating: null, reviewCount: null, sourceUrl: null }, { status: 500 });
  }
}
