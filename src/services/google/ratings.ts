/**
 * Google puan çekici — API anahtarı GEREKMEZ.
 *
 * Nasıl çalışır:
 * 1. Playwright + Stealth ile Chromium açar (`@mr_ozio/playwright-stealth`)
 * 2. Google Search'e gider, JS render'ını bekler
 * 3. Sayfadaki schema.org JSON-LD'yi parse eder
 * 4. aggregateRating varsa (yıldız puanı + yorum sayısı) döndürür
 * 5. Yoksa / hata alırsa null döner
 *
 * Neden Playwright?
 * - 2026'da Google, JS çalıştırmayan istekleri (plain fetch) blokluyor
 * - Stealth ile TLS fingerprint + bot detection bypass
 * - Browser singleton ile yeniden kullanım (ilk istek ~3sn, sonrakiler ~1sn)
 *
 * Dezavantaj: Chromium binary ~300MB → Docker'da çalışır, Vercel serverless'ta çalışMAZ
 */

import { createHash } from "node:crypto";
import { logEvent } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";
import { scrapeGoogleRating } from "@/services/google/playwright-scraper";
import type { GoogleRatingResult } from "@/services/google/playwright-scraper";

// Re-export type
export type { GoogleRatingResult };

// In-memory fallback cache (Redis yoksa kullanılır)
const memoryCache = new Map<string, { expiresAt: number; data: GoogleRatingResult | null }>();

function cacheKey(name: string, city: string) {
  return createHash("sha256").update(`google-rating:${name.toLowerCase().trim()}:${city.toLowerCase().trim()}`).digest("hex");
}

async function readCache(key: string): Promise<GoogleRatingResult | null | "miss"> {
  // Memory cache
  const mem = memoryCache.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.data;
  if (mem) memoryCache.delete(key);

  // Redis cache
  try {
    const redis = await getRedisClient();
    if (redis) {
      const raw = await redis.get(`discibul:google-rating:${key}`);
      if (raw) return JSON.parse(raw) as GoogleRatingResult | null;
    }
  } catch {
    // Redis yoksa devam et
  }

  return "miss";
}

async function writeCache(key: string, data: GoogleRatingResult | null, ttlSeconds: number) {
  memoryCache.set(key, { expiresAt: Date.now() + ttlSeconds * 1_000, data });

  try {
    const redis = await getRedisClient();
    if (redis) await redis.set(`discibul:google-rating:${key}`, JSON.stringify(data), { EX: ttlSeconds });
  } catch {
    // In-memory yeterli
  }
}

/**
 * OSM kliniği için Google yıldız puanını çeker.
 * Playwright + Stealth kullanır (API anahtarı gerekmez).
 * 7 gün cache'ler (günde max 1 istek/klinik).
 */
export async function fetchGoogleRating(clinicName: string, city: string): Promise<GoogleRatingResult | null> {
  const key = cacheKey(clinicName, city);
  const cached = await readCache(key);
  if (cached !== "miss") return cached;

  try {
    const rating = await scrapeGoogleRating(clinicName, city);
    await writeCache(key, rating, rating ? 604_800 : 3_600); // 7 gün / 1 saat
    return rating;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    logEvent("warn", "google_rating_error", { clinic: clinicName, reason });
    await writeCache(key, null, 600); // 10 dk bekle
    return null;
  }
}

/**
 * Toplu puan çekme — her kliniği teker teker dolaşır.
 * @param clinics [name, city][]
 * @returns Map<clinicName, rating>
 */
export async function fetchBulkGoogleRatings(clinics: [string, string][]): Promise<Map<string, GoogleRatingResult | null>> {
  const results = new Map<string, GoogleRatingResult | null>();

  // Paralel çekme — en fazla 5 eşzamanlı
  const queue = [...clinics];
  const workers: Promise<void>[] = [];

  for (let i = 0; i < Math.min(5, queue.length); i++) {
    workers.push((async () => {
      while (queue.length > 0) {
        const [name, city] = queue.shift()!;
        results.set(name, await fetchGoogleRating(name, city));
        // Google rate limit'i aşmamak için 200ms bekle
        await new Promise((r) => setTimeout(r, 200));
      }
    })());
  }

  await Promise.all(workers);
  return results;
}
