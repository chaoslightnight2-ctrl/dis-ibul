/**
 * Google Yıldız Puanı Çekici — Playwright + Firefox + Google Maps DOM.
 *
 * NASIL ÇALIŞIR:
 * 1. Firefox ile Google Maps'de klinik adı + şehir aratır
 * 2. İlk sonuca tıklar (search → place sayfası)
 * 3. DOM'dan rating + review sayısını çeker:
 *    - `div.F7nice` → "4,7(39)" formatında rating + review
 *    - `[aria-label*="yıldız"]` → "4,7 yıldızlı"
 *
 * NEDEN FIREFOX?
 * Python google-maps-scraper'ın keşfi: Chromium headless'ta
 * Google Maps review verisini gizliyor. Firefox ile çalışıyor.
 *
 * NEDEN @mr_ozio/playwright-stealth KULLANMIYORUZ?
 * Firefox için stealth eklentisi henüz mevcut değil.
 * Firefox'un kendisi zaten Chromium'a göre daha az detection'a takılıyor.
 * CONSENT cookie + gerçekçi viewport yeterli oluyor.
 */

import type { Page } from "playwright";
import { createScrapeContext } from "@/lib/browser-manager";
import { logEvent } from "@/lib/logger";

export type GoogleRatingResult = {
  rating: number;
  reviewCount: number;
  sourceUrl: string;
};

const MAPS_TIMEOUT = 12_000;
const SETTLE_MS = 1_500;

/**
 * Google Maps'te klinik adı + şehir ile arama yapıp yıldız puanını çeker.
 */
export async function scrapeGoogleRating(
  clinicName: string,
  city: string,
): Promise<GoogleRatingResult | null> {
  const query = `${clinicName} ${city}`;
  const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}/`;

  const context = await createScrapeContext();

  // Font/media yükleme — hız için blokla
  const page = await context.newPage();
  await page.route("**/*", async (route) => {
    const type = route.request().resourceType();
    if (type === "font" || type === "media") await route.abort();
    else await route.continue();
  });

  try {
    // 1. Google Maps'de ara
    logEvent("info", "maps_search_start", { clinic: clinicName, city });
    const loaded = await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: MAPS_TIMEOUT,
    }).then(() => true).catch(() => false);

    if (!loaded) {
      logEvent("warn", "maps_search_timeout", { clinic: clinicName });
      return null; // Sayfa yüklenmezse hızlıca dön
    }

    // Sayfanın yüklenmesi için kısa bekle
    await page.waitForTimeout(SETTLE_MS);

    // 2. İlk sonuca tıkla (search → place sayfası)
    const firstResult = await page.$('a[href*="/maps/place/"]');
    if (firstResult) {
      await firstResult.click().catch(() => {});
      await page.waitForTimeout(1_500);
    }

    // 3. DOM'dan rating + review çek
    const result = await extractRatingFromPage(page, searchUrl);
    if (result) {
      logEvent("info", "maps_rating_found", {
        clinic: clinicName,
        rating: String(result.rating),
        reviews: String(result.reviewCount),
      });
    } else {
      logEvent("warn", "maps_rating_not_found", { clinic: clinicName });
    }

    return result;
  } catch (error) {
    logEvent("warn", "maps_scrape_error", {
      clinic: clinicName,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  } finally {
    await context.close().catch(() => {});
  }
}

/* ------------------------------------------------------------------ */
/*  Rating Extraction                                                 */
/* ------------------------------------------------------------------ */

export async function extractRatingFromPage(
  page: Page,
  sourceUrl: string,
): Promise<GoogleRatingResult | null> {
  // Yöntem 1: F7nice div'i (en güvenilir)
  const f7 = await extractFromF7nice(page);
  if (f7) return { ...f7, sourceUrl };

  // Yöntem 2: Aria-label
  const aria = await extractFromAria(page);
  if (aria) return { ...aria, sourceUrl };

  return null;
}

/**
 * div.F7nice → "4,7(39)" formatında rating + review
 * Bu Google Maps'in en stabil rating container'ı.
 */
async function extractFromF7nice(
  page: Page,
): Promise<{ rating: number; reviewCount: number } | null> {
  try {
    const text = await page.$eval("div.F7nice", (el) => el.textContent).catch(
      () => null,
    );
    if (!text) return null;

    // Format: "4,7(39)" veya "4.7(39)" veya "4,7 (39)"
    const match = text.match(
      /([\d,]+)\s*\(?\s*([\d.,]+)\s*\)?/,
    );
    if (!match) return null;

    const rating = parseFloat(match[1].replace(",", "."));
    const reviewCount = parseInt(match[2].replace(/[.,]/g, ""), 10);

    if (isNaN(rating) || isNaN(reviewCount)) return null;
    if (rating < 1 || rating > 5) return null;

    return { rating, reviewCount };
  } catch {
    return null;
  }
}

/**
 * Aria-label: "4,7 yıldızlı" → rating
 * Review sayısı ayrıca aranır.
 */
async function extractFromAria(
  page: Page,
): Promise<{ rating: number; reviewCount: number } | null> {
  try {
    // Yıldız puanı
    const stars = await page.$$eval(
      '[aria-label*="yıldız"], [aria-label*="star"], [aria-label*="Yıldız"]',
      (els) =>
        els
          .map((el) => el.getAttribute("aria-label"))
          .filter(Boolean) as string[],
    );

    let rating: number | null = null;
    for (const label of stars) {
      const match = label.match(/([\d,]+)\s*yıldız/i);
      if (match) {
        rating = parseFloat(match[1].replace(",", "."));
        if (rating >= 1 && rating <= 5) break;
      }
    }

    if (rating === null || rating < 1 || rating > 5) return null;

    // Review sayısı
    let reviewCount = 0;

    // Yöntem A: F7nice içinde (4,7(39) formatı)
    const f7text = await page
      .$eval("div.F7nice", (el) => el.textContent)
      .catch(() => "");
    const rcMatch = (f7text ?? "").match(/\(([\d.,]+)\)/);
    if (rcMatch) {
      reviewCount = parseInt(rcMatch[1].replace(/[.,]/g, ""), 10) || 0;
    }

    // Yöntem B: Body'deki yorum sayısı
    if (!reviewCount) {
      const bodyText = await page.textContent("body").catch(() => "") ?? "";
      const reviewMatch = bodyText.match(/(\d[\d.,]*)\s*yorum/i);
      if (reviewMatch) {
        reviewCount = parseInt(reviewMatch[1].replace(/[.,]/g, ""), 10) || 0;
      }
    }

    return { rating, reviewCount };
  } catch {
    return null;
  }
}
