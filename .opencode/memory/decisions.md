# Architecture Decisions

## 2026-07-24 (revize): Skill'ler — model `skill()` ile manuel yüklemeli
- **Context:** Plugin yaklaşımı yanlıştı. Kullanıcı, Step 3'ün model tarafından uygulanmasını istiyor: plan aşamasında eşleşen skill'leri belirle, `skill()` ile yükle, metodolojisini takip et.
- **Chosen:** Step 3 geri getirildi, her eşleşen skill için `call skill("...")` talimatı eklendi. Auto-skill-trigger plugin silindi.
- **Rationale:** Model kendi planını yapmalı, hangi skill'lerin lazım olduğuna karar vermeli, sonra onları yükleyip kullanmalı. Plugin yaklaşımı bu akışı bozuyordu.
- **Status:** complete

## 2026-07-24: DişçiBul kayıtlı klinikler kaldırıldı
- **Context:** Uygulama artık yalnızca OpenStreetMap üzerinden çekilen klinikleri gösterecek. Seed'deki 3 demo klinik ve DişçiBul kayıt sistemi arama sonuçlarından çıkarıldı.
- **Chosen:** Tamamen kaldır
- **Rationale:** Kullanıcı yalnızca OSM/API'den çekilen güncel veriyi görmek istiyor.
- **Status:** complete

## 2026-07-24: Google puan çekme — Playwright + Firefox + Maps DOM
- **Context:** Önce Chromium + Google Search JSON-LD denendi (0 sonuç). Chromium headless review verisini gizliyor.
- **Chosen:** Firefox + Google Maps DOM scraping
- **Rationale:** Python google-maps-scraper keşfi: Firefox ile çalışıyor. `div.F7nice` DOM elementi stabil.
- **Status:** complete

## 2026-07-24: OSM Klinik sayısı artırma
- **Context:** Şehir sayfalarında çok az klinik görünüyordu.
- **Chosen:** Limitler artırıldı, query genişletildi, timeout büyütüldü.
- **Status:** complete (revize edildi)

## 2026-07-24: Demo → production dönüşümü
- **Context:** Proje demo aşamasından çıkıyor.
- **Chosen:** Mock'ları error'a çevir, dev fallback olarak tut
- **Status:** complete

## 2026-07-26: OSM Timeout — Overpass fetch kesintisi
- **Context:** Fetch timeout (max 30s) Overpass query timeout'undan (60s) önce tetikleniyor → yanıt kesiliyor
- **Chosen:** Tüm timeout'ları eşle: OSM_TIMEOUT_MS max 30s→90s, Overpass timeout city 30→60, Turkey 45→90
- **Rationale:** Büyük şehirlerde Overpass 30-60sn arası yanıt verebiliyor. Fetch timeout daha kısa olursa sonuç kesilir.
- **Trade-offs:** Kullanıcı arama sonuçlarını görmek için daha uzun bekleyebilir (60sn), ama daha çok sonuç görür.
- **Status:** active

## 2026-07-26: Overpass Output Limitsiz
- **Context:** `out center ${resultLimit * 3}` Overpass'in döndürebildiği sonuç miktarını yapay olarak sınırlıyor. Schema'daki max 2000 de 500*3=1500'ü geçince hata veriyor.
- **Chosen:** `out center;` (limitsiz), element schema max 2000→10000
- **Rationale:** Overpass kendi max size limitini zaten uygular. Fazladan output limit sadece sonuçları keser.
- **Trade-offs:** Daha büyük yanıtlar, daha fazla bellek. Ama resultLimit zaten JS tarafında uygulanıyor (clients.slice(0, resultLimit)).
- **Status:** active

## 2026-07-26: Rating Fetch Timeout
- **Context:** `firefox.launch()` asılı kalabiliyor (missing binary, resource issue). `page.goto()` da asılı kalabiliyor. "Puan alınıyor..." sonsuza kadar gösteriliyor.
- **Chosen:** Her katmanda timeout: browser launch 15s, API route 30s, sayfa yüklenmezse hemen null dön
- **Rationale:** Zincirleme timeout: browser → sayfa → API. Her biri birbirini tamamlar.
- **Status:** active

## 2026-07-26: Batch Rating Endpoint
- **Context:** Her klinik kartı ayrı API çağrısı yapıyor (her biri yeni browser context). 50 klinik = 50 browser context.
- **Chosen:** `POST /api/google/ratings` — TEK browser context ile tüm klinikleri sırayla sorgular
- **Rationale:** Browser context oluşturma overhead'i azalır. Aynı cookie/oturum paylaşılır.
- **Trade-offs:** Tüm klinikler sırayla sorgulanır (paralel değil). 50 klinik için toplam ~30sn. maxDuration=30sn.
- **Status:** active

## 2026-07-26: OSM Clinic Detail Pages
- **Context:** OSM klinikleri için `/klinikler/[slug]` çalışmıyor (sadece kayıtlı klinikler). Kullanıcılar detay göremiyor.
- **Chosen:** `/dis-klinikleri/[city]/[osmSlug]` — Overpass ID lookup ile tekil sorgu
- **Rationale:** Overpass'te ID ile sorgu çok hızlı (1-2sn). Leaflet harita ile konum gösterimi.
- **Status:** active
