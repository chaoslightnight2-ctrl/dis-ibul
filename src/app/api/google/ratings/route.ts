/**
 * Batch Google rating endpoint.
 *
 * Tüm klinikleri TEK browser context ile sorgular — her klinik için
 * ayrı ayrı browser açıp kapatmaktan çok daha hızlı.
 *
 * POST /api/google/ratings
 * Body: { clinics: [name, city][] }
 * Returns: { results: Record<string, { rating, reviewCount, sourceUrl } | null> }
 *
 * Her sonuç anahtarı "name|city" formatındadır.
 */

import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { createScrapeContext } from "@/lib/browser-manager";
import { extractRatingFromPage } from "@/services/google/playwright-scraper";

const MAPS_TIMEOUT = 10_000;
const MAX_CLINICS = 50;

export async function POST(request: NextRequest) {
  let body: { clinics?: [string, string][] };

  try {
    body = await request.json() as { clinics?: [string, string][] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clinics = (body.clinics ?? []).slice(0, MAX_CLINICS);
  if (!clinics.length) {
    return NextResponse.json({ error: "clinics array required" }, { status: 400 });
  }

  const results: Record<string, { rating: number; reviewCount: number; sourceUrl: string } | null> = {};
  let context;
  try {
    context = await createScrapeContext();

    for (const [name, city] of clinics) {
      if (!name || !city) continue;
      const key = `${name}|${city}`;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${city}`)}/`;

      try {
        const page = await context.newPage();
        await page.route("**/*", async (route) => {
          const type = route.request().resourceType();
          if (type === "font" || type === "media") await route.abort();
          else await route.continue();
        });

        const loaded = await page.goto(searchUrl, {
          waitUntil: "domcontentloaded",
          timeout: MAPS_TIMEOUT,
        }).then(() => true).catch(() => false);

        if (loaded) {
          await page.waitForTimeout(1_000);

          // İlk sonuca tıkla
          const firstResult = await page.$('a[href*="/maps/place/"]');
          if (firstResult) {
            await firstResult.click().catch(() => {});
            await page.waitForTimeout(1_000);
          }

          // Rating çek
          const rating = await extractRatingFromPage(page, searchUrl);
          if (rating) {
            results[key] = rating;
            logEvent("info", "batch_rating_found", { clinic: name, rating: String(rating.rating) });
          } else {
            results[key] = null;
          }
        } else {
          results[key] = null;
        }

        await page.close().catch(() => {});
      } catch (err) {
        logEvent("warn", "batch_rating_error", { clinic: name, error: String(err) });
        results[`${name}|${city}`] = null;
      }

      // Sayfalar arası kısa bekle — rate limit koruması
      await new Promise((r) => setTimeout(r, 300));
    }
  } catch (err) {
    logEvent("error", "batch_rating_context_error", { error: String(err) });
    return NextResponse.json({ error: "Browser error" }, { status: 500 });
  } finally {
    if (context) await context.close().catch(() => {});
  }

  // 30sn toplam timeout
  return NextResponse.json({ results });
}

export const maxDuration = 30;
