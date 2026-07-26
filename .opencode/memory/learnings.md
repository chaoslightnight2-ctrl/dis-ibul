# Learnings

## 2026-07-24: Senior-dev kurulum testi
- opencode.json plugin array'ine `opencode-reflection` eklendi
- expert-engineer-reasoning skill'i oluşturuldu
- expert-reasoning.js plugin'i hata döngülerini tespit ediyor
- senior-dev agent'ı artık default_agent olarak ayarlandı

## 2026-07-24: Skill yükleme — doğru akış
- **Kural:** Plan aşamasında (Step 3) eşleşen skill'leri belirle, sonra **her birini `skill()` ile yükle**
- **Yanlış yaklaşım:** Plugin ile otomatik enjekte — modelin ne yaptığını bilmeden skill kullanması anlamsız
- **Doğru yaklaşım:** model → plan → hangi skill lazım → `skill("adı")` → metodolojiyi uygula
- **auto-skill-trigger.js plugin'i silindi** — yanlış çözümdü
- **senior-dev.md Step 3 geri getirildi** — her skill için `call skill("...")` yazıyor
- **senior-planning/SKILL.md Step 3 geri getirildi**

## 2026-07-24: Demo → production dönüşümü
- Production'da mock provider'lar **error** olmalı (warning değil), yoksa deploy sessizce patlar
- `env.ts` (build-time Zod schema) ile `runtime-env.ts` (runtime validation) arasındaki fark kritik: env.ts sadece NEXT_PUBLIC olmayanları schema'dan geçirir, runtime-env.ts ise production'da tümünü doğrular
- Dockerfile multi-stage + standalone output ile production'a hazırdı — değişiklik gerekmedi
- `.env.example` projenin tüm env var'larını tek yerde gösterir — yeni developer onboarding'i için kritik
- 50+ env var olması korkutucu görünse de çoğunun sensible default'u var (disabled, local, vs.)
- OSM ve Google Places provider'ları birbirini tamamlıyor: OSM her zaman açık (default), Google isteğe bağlı

## 2026-07-24: Google puan çekme — API'siz yaklaşım
- Google Places API **paralı** (ama $200/ay ücretsiz kredi var, ~4000 arama)
- **Alternatif:** Google Search sayfasındaki schema.org JSON-LD'yi sunucu tarafında parse et → aggregateRating'i bul
- `fetchGoogleRating()` → Google'a istek atar, JSON-LD'den yıldız puanı + yorum sayısını çıkarır
- Redis + in-memory cache ile rate limit koruması: başarılı → 7 gün, başarısız → 1 saat cache
- Client-side `GoogleRatingBadge` bileşeni → her OSM kartı için API'ye istek atar, yüklenirken "Puan alınıyor..." gösterir
- Dezavantaj: Google rate limit uygulayabilir, IP ban riski var. Production'da proxy/RESIDENTIAL IP gerekebilir
- **En sağlam çözüm:** Google Places API + $200/ay ücretsiz kredi

## 2026-07-24: KRİTİK — Playwright Firefox keşfi
- **Python google-maps-scraper'ın en önemli keşfi:** Chromium headless'ta Google Maps review verisini gizliyor. **Firefox** ile çalışıyor!
- `@mr_ozio/playwright-stealth` Chromium için — Firefox'a gerek yok. Firefox'un fingerprint'i zaten daha "gerçek" görünüyor.
- **Google Search JSON-LD 2026'da çalışmıyor.** Google Search sayfası artık `application/ld+json` script tag'i içermiyor. Google Maps DOM'dan çekmek gerekiyor.
- **Google Maps DOM yapısı:** `div.F7nice` → "4,7(39)" formatında rating+review. `[aria-label*="yıldız"]` → "4,7 yıldızlı". Her ikisi de stabil.
- **CONSENT cookie** zorunlu: `{ name: "CONSENT", value: "YES+cb.20240101-01-p0.en+FX+430", domain: ".google.com" }` ile consent dialog bypass
- Firefox binary: ~117MB (Chromium 300MB'den daha hafif)
- Docker'da Firefox için sistem deps sadece `libnss3` + `libnspr4` (Chromium'daki gibi 15+ paket gerekmez)
- **Analoji:** Chromium → Google'a şüpheli görünüyor, Firefox → normal kullanıcı

## 2026-07-24: OSM Klinik sorgu iyileştirmesi
- Overpass query'de eksik tag'ler tespit edildi: `healthcare=clinic` + `healthcare:speciality`, `healthcare:speciality=dentist` (ry'siz), `healthcare:speciality=oral_surgery`
- Limitler çok düşüktü: şehir 30→150, Türkiye 100→500
- Overpass timeout: şehir 20→30s, Türkiye 30→45s (büyük şehirler için yeterli değildi)
- Content-length limit: 3MB → 10MB (büyük yanıtlar için)

## 2026-07-24: Playwright + Stealth implementasyonu
- **`@mr_ozio/playwright-stealth`** (v1.0.0) — Node.js için en iyi stealth paketi (2026). playwright-extra-plugin-stealth çalışmıyor (placeholder), @mr_ozio aktif geliştiriliyor.
- **Browser singleton pattern**: globalThis üzerinde Symbol ile store, lazy-launch, disconnected event ile auto-reconnect
- **Docker'da Chromium**: `PLAYWRIGHT_BROWSERS_PATH=0` ile binary node_modules içine kurulur → COPY ile taşınır. Sistem deps: libnss3, libnspr4, libatk1.0-0t64, libcups2t64, libdrm2, libgbm1
- **Next.js 16 React lint**: `Math.random()` render'da error, `useRef.current` render'da error. Çözüm: ID'yi useEffect'te oluştur veya eleman referansını doğrudan Leaflet'e ver
- **TypeScript Symbol issue**: `[Symbol + ":closing"]` computed property is not allowed. Çözüm: string key kullan (`"discibul:playwright-closing"`)

## 2026-07-24: Kullanıcı odaklı feature'lar
- **Leaflet harita** Next.js'te kullanırken: SSR kapat (`dynamic(() => import(...), { ssr: false })`), CSS ayrı import edilir, marker icon fix'i gerekir
- **Geolocation + Nominatim** ücretsiz ve API key gerektirmez ama rate limit (1 req/s) var — production'da cache'lenmeli
- **`/tedaviler`** sayfası DB'deki Treatment ve TreatmentCategory modellerini kullanır. Seed'de 4 tedavi var ama tam katalog için seed genişletilebilir
- **Breadcrumbs** basit bir navigasyon aracı ama SEO için JSON-LD BreadcrumbList de eklenmeli
- **City sayfaları** (`/dis-klinikleri/[city]`) registered clinic boş kalınca OSM'e düşmeli. `isTurkeyCity()` ile doğrulama yapılıyor
- **Kullanıcı ara yüzü iyileştirmeleri:** Popüler şehirler, tedavi kartları, "Neden DişçiBul?" bölümü dönüşümü artırır

## 2026-07-26: OSM Timeout & Output Limit Fix
- **Sorun:** Fetch timeout (max 30s) Overpass'ten (60-90s) önce tetikleniyordu → yanıt kesiliyor, az klinik dönüyordu
- **Çözüm:** `OSM_TIMEOUT_MS` max 30s→90s, Overpass `[timeout:30/45]` → `[timeout:60/90]`
- **Output limit:** `out center ${resultLimit * 3}` → `out center` (limitsiz) — Overpass'in döndürebildiği KADAR sonuç
- **Element schema:** max 2,000 → 10,000 — schema validation hatasından kaçınmak için
- **Content-length limit:** 10MB → 50MB — büyük şehir yanıtları için

## 2026-07-26: Rating Fetch Asılı Kalma Fix
- **Sorun:** `firefox.launch()` veya `page.goto()` asılı kalabiliyor → "Puan alınıyor..." sonsuza kadar gösteriliyor
- **Çözüm:** Browser launch 15s timeout, API route 30s timeout (`Promise.race`), Maps timeout 20s→12s
- **Batch endpoint:** `POST /api/google/ratings` — tüm klinikleri TEK browser context ile sorgular (50 klinik, 30sn)
- **Client cache:** `ratings-cache.ts` — batch sonuçlarını Map'te tutar, `GoogleRatingBadge` önce cache'e bakar

## 2026-07-26: OSM Detail Page
- OSM ID'den tekil sorgu: `[out:json][timeout:10];(node($id););out center;` — çok hızlı
- Leaflet map client component: `"use client"` ile SSR kapat, default icon fix
- `/dis-klinikleri/[city]/[osmSlug]` → `node-12345` formatında slug

## 2026-07-26: Test Düzeltmesi
- `GOOGLE_PROVIDER: "mock"` testi production audit'ten sonra geçersiz kaldı
- Çözüm: `"mock"` → `"disabled"` (test amacıyla uyumlu)
