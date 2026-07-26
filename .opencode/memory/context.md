# Current Context

## Active Task (2026-07-26)
- **What:** Klinik sayısı + yıldız puanı düzeltmeleri + kullanıcı odaklı feature'lar
- **Status:** complete

## Yapılan Değişiklikler

### 1. OSM Klinik Sayısı (çok az klinik sorunu)
| Değişiklik | Eski | Yeni |
|------------|------|------|
| `OSM_TIMEOUT_MS` max | 30s | 90s |
| Overpass query timeout (şehir) | 30s | 60s |
| Overpass query timeout (Türkiye) | 45s | 90s |
| Output buffer | `resultLimit * 3` | limitsiz (`out center;`) |
| Element schema max | 2000 | 10000 |
| Content-length limit | 10MB | 50MB |
| `OSM_MAX_RESULTS_TURKEY` max | 2000 | 2000 (aynı) |
| `request()` timeout max | 30s | 90s |

**Neden:** Fetch timeout Overpass'ten önce tetikleniyordu → yanıt kesiliyordu. Output limit de sonuçları yapay olarak sınırlıyordu.

### 2. Yıldız Puanı Asılı Kalması
| Değişiklik | Açıklama |
|------------|----------|
| API route 30s timeout | `Promise.race` ile — asla sonsuza kadar beklemez |
| Browser launch 15s timeout | Firefox başlatılamazsa hızlıca hata döner |
| `MAPS_TIMEOUT` 20s→12s | Sayfa yüklenmezse çabuk döner |
| `SETTLE_MS` 3s→1.5s | Bekleme süresi azaltıldı |
| Sayfa yüklenmezse `null` dön | Önce `loaded` kontrolü, hızlıca çık |

### 3. Toplu Puan Yükleme (Batch Ratings)
- `POST /api/google/ratings` — tüm klinikleri TEK browser context ile sorgular
- `src/lib/ratings-cache.ts` — client-side cache (Map)
- `GoogleRatingBadge` önce cache'e bakar, yoksa API'yi çağırır
- `BatchRatingsLoader` component'i sayfa yüklenince tüm puanları önceden çeker
- Arama sayfası ve şehir sayfasına entegre edildi

### 4. UI İyileştirmeleri
- Şehir sayfası (`/dis-klinikleri/[city]`) artık `OsmClinicCard` kullanıyor (Google puanı, butonlar, disclaimer)
- Sıralama eklendi (isim, ilçe) — URL query parameter ile
- `OsmClinicCard`'a "Detay" butonu eklendi

### 5. OSM Klinik Detay Sayfası
- `/dis-klinikleri/[city]/[osmSlug]` — OSM klinikleri için detay sayfası
- Leaflet harita, full bilgiler, Google puanı
- Overpass ID lookup ile tekil sorgu

### 6. Test Düzeltmesi
- `billing-and-runtime.test.ts` — `GOOGLE_PROVIDER: "mock"` → `"disabled"` (production audit ile uyumlu)

## Yeni Dosyalar
- `src/app/api/google/ratings/route.ts` — batch rating endpoint
- `src/lib/ratings-cache.ts` — client-side rating cache
- `src/components/google/batch-ratings-loader.tsx` — batch preloader
- `src/app/dis-klinikleri/[city]/[osmSlug]/page.tsx` — OSM detail page
- `src/app/dis-klinikleri/[city]/[osmSlug]/detail-map.tsx` — detail map

## Değişen Dosyalar
- `src/services/osm/clinics.ts` — limitsiz output, büyük timeout, geniş schema
- `src/lib/runtime-env.ts` — OSM_TIMEOUT_MS max 30s→90s
- `src/lib/browser-manager.ts` — browser launch 15s timeout
- `src/services/google/playwright-scraper.ts` — düşük timeout, loaded kontrolü
- `src/app/api/google/rating/route.ts` — 30s toplam timeout
- `src/components/google/google-rating-badge.tsx` — cache kontrolü
- `src/components/clinic/osm-clinic-card.tsx` — "Detay" linki
- `src/app/arama/page.tsx` — sıralama, batch loader
- `src/app/dis-klinikleri/[city]/page.tsx` — `OsmClinicCard`, batch loader
- `.env.example` — güncel limitler
- `tests/billing-and-runtime.test.ts` — GOOGLE_PROVIDER mock→disabled

## Kritik Notlar
- **Firefox kullan!** Chromium headless Google Maps'te review verisini gizliyor
- **Batch endpoint** en fazla 50 klinik kabul eder, 30sn maxDuration
- **Sort** URL query parameter ile çalışır (`/arama?sort=name`)
- Overpass testleri local'de çalışmaz (overpass-api.de 406 döner) — sadece Docker/production'da çalışır
