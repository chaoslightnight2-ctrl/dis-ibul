"use client";

import { useEffect, useRef } from "react";
import { setCachedRatings, trimCache } from "@/lib/ratings-cache";
import { logEvent } from "@/lib/logger";

type Props = {
  /** [name, city][] — toplu puan çekmek için klinik listesi */
  clinics: [string, string][];
};

/**
 * Sayfa yüklendiğinde tüm kliniklerin puanlarını toplu halde çeker
 * ve client-side cache'e yazar. Her bir `GoogleRatingBadge` cache'ten
 * okuduğu için ayrı ayrı API çağrısı yapılmaz.
 *
 * Kullanım: Arama sonuçları sayfasında liste başına bir kere ekleyin.
 *
 * ```tsx
 * <BatchRatingsLoader clinics={clinics.map(c => [c.name, c.city!])} />
 * ```
 */
export function BatchRatingsLoader({ clinics }: Props) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    if (!clinics.length) return;

    // Cache'te olanları filtrele
    const uncached = clinics.filter(
      ([name, city]) => name && city,
    );

    if (!uncached.length) return;

    loadedRef.current = true;

    async function loadBatch() {
      try {
        const res = await fetch("/api/google/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clinics: uncached }),
        });
        if (!res.ok) return;
        const json = (await res.json()) as { results?: Record<string, unknown> };
        if (json.results) {
          setCachedRatings(json.results as Record<string, { rating: number; reviewCount: number; sourceUrl: string } | null>);
          trimCache();
        }
      } catch (err) {
        logEvent("warn", "batch_ratings_failed", { error: String(err) });
      }
    }

    // Sayfa yüklendikten sonra beklemeden çek — kullanıcı deneyimini etkilemez
    const timer = setTimeout(loadBatch, 500);
    return () => clearTimeout(timer);
  }, [clinics]);

  // Görünmez — sadece veri yükler
  return null;
}
