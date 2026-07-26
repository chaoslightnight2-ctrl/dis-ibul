/**
 * Client-side rating cache.
 *
 * Batch rating endpoint'ten gelen sonuçları geçici olarak tutar,
 * böylece her `GoogleRatingBadge` ayrı ayrı API çağrısı yapmak yerine
 * cache'ten okuyabilir.
 */

type RatingData = { rating: number; reviewCount: number; sourceUrl: string } | null;

const cache = new Map<string, RatingData>();

function cacheKey(name: string, city: string) {
  return `${name.toLowerCase().trim()}|${city.toLowerCase().trim()}`;
}

export function getCachedRating(name: string, city: string): RatingData | undefined {
  return cache.get(cacheKey(name, city));
}

export function setCachedRating(name: string, city: string, data: RatingData) {
  cache.set(cacheKey(name, city), data);
}

export function setCachedRatings(
  results: Record<string, { rating: number; reviewCount: number; sourceUrl: string } | null>,
) {
  for (const [key, data] of Object.entries(results)) {
    cache.set(key.toLowerCase().trim(), data);
  }
}

/**
 * Cache boyutunu sınırla (en fazla 500 giriş).
 */
export function trimCache(max = 500) {
  if (cache.size > max) {
    const keys = [...cache.keys()];
    for (let i = 0; i < keys.length - max; i++) {
      cache.delete(keys[i]!);
    }
  }
}
