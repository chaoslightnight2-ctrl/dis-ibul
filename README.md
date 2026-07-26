# DişçiBul

DişçiBul; hastaların diş kliniği keşfetmesini, fiyat ve ilk muayene bilgisini karşılaştırmasını, randevu veya ayrı klinik teklifleri istemesini sağlayan; kliniklere de başvuru, talep ve fiyat yönetimi sunan rol tabanlı bir sağlık platformudur.

## Çalışan ürün çekirdeği

- Better Auth ile güvenli e-posta/şifre kaydı, doğrulama, bir saatlik şifre yenileme ve sıfırlama sonrası oturum iptali.
- Hasta, klinik yöneticisi, diş hekimi, moderatör ve süper yönetici yetkileri.
- PostgreSQL/PostGIS hedefli Prisma veri modeli, migration ve kurgusal seed verisi.
- Ana sayfa, arama, karşılaştırma, klinik ve hekim profilleri için tek PostgreSQL veri kaynağı; kod içi klinik fallback'i kullanılmaz.
- Hasta randevu ve teklif taleplerinin kalıcı kaydı.
- Klinik sahiplik kontrolüyle randevu durumu ve ayrı fiyat teklifi yanıtı yönetimi.
- Hastaya özel randevu, teklif ayrıntıları ve kalıcı favori ekleme/çıkarma akışı.
- Kliniğe özel gerçek operasyon sayıları, profil düzenleme, moderasyonlu fiyat girişi ve yayın hazırlık durumu.
- Klinik başvurusu, incelemeye gönderme, ek belge/ret/onay kararları, fiyat onayı, audit log ve yayına alma zinciri.
- Yetkili moderasyon panelinde gerçek kullanıcı, klinik, başvuru, karar ve entegrasyon ölçümleri.
- Şehir, ilçe, tedavi, fiyat, ilk muayene, kaynak ve kayıtlı klinik puanı filtreleri.
- OpenStreetMap Nominatim ve Overpass ile seçilen şehir veya ilçede ücretsiz internet kliniği keşfi, önbellek, hız sınırı ve görünür kaynak atfı.
- Aynı kaynak koruması, Redis destekli dağıtık istek sınırı, Zod doğrulaması, kaynak sahipliği ve KVKK rıza kaydı.
- Hesap verisi dışa aktarma, bildirim tercihleri ve iptal edilebilir hesap silme talebi yaşam döngüsü.
- CSP, HSTS, çerçeve engelleme, içerik türü ve tarayıcı izin güvenlik başlıkları.

## Yerel kurulum

```bash
npm install
docker compose up -d
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

`.env.example` dosyasındaki değerleri yerel `.env` dosyanıza taşıyın ve en az 32 karakterli rastgele bir `BETTER_AUTH_SECRET` kullanın.

Gerçek e-posta gönderimi için `EMAIL_PROVIDER=resend`, `RESEND_API_KEY` ve doğrulanmış bir `EMAIL_FROM` tanımlayın. E-posta zorunluluğunu açmadan önce sağlayıcı teslimatını test edin; ardından `EMAIL_REQUIRE_VERIFICATION=true` kullanın. Üretimde `REDIS_URL` zorunludur ve güvenlik sayacı kullanılamadığında yazma işlemleri kontrollü olarak durur.

İnternet klinik keşfi varsayılan olarak ücretsiz OpenStreetMap Nominatim ve Overpass servisleriyle çalışır. Şehir zorunludur; konum sonucu yedi gün, klinik sonucu otuz dakika önbelleğe alınır ve Nominatim istekleri saniyede bir isteğin altında tutulur:

```bash
OSM_NOMINATIM_URL=https://nominatim.openstreetmap.org/search
OSM_OVERPASS_URL=https://overpass-api.de/api/interpreter
OSM_MAX_REQUESTS_PER_MINUTE=30
OSM_MAX_RESULTS=30
OSM_GEOCODE_CACHE_SECONDS=604800
OSM_RESULT_CACHE_SECONDS=1800
```

OpenStreetMap sonuçları puan veya kullanıcı yorumu içermez. Uygulama klinik adına ve adresine göre anahtarsız bir Google Maps arama bağlantısı üretir; Google yorum metinlerini çekmez veya saklamaz. OpenStreetMap genel servisleri ücretsiz ve best-effort çalışır; yüksek trafikte kendi Nominatim/Overpass kurulumunuza geçebilmek için uç noktalar ortam değişkenidir.

Google puanı ve yorumları için yasal, anahtarsız ve sınırsız bir Google API'si yoktur. Resmi Google Places API etkinleştirilip `GOOGLE_PROVIDER=google` ve sunucuya özel `GOOGLE_MAPS_API_KEY` tanımlandığında arama kartları puan ve değerlendirme sayısını, detay sayfası en fazla beş yorumu gösterir. Google'ın ilgili Places SKU'larındaki aylık 1.000 ücretsiz kullanım sınırının aşılmaması için uygulama varsayılan olarak arama ve detay isteklerini ayrı ayrı 900/ay ile keser, Redis üzerinden sayar ve sonuçları önbelleğe alır. Google erişimi yapılandırılmamışsa veya koruma kotası dolmuşsa arama otomatik olarak OpenStreetMap'e döner; veri kazıma kullanılmaz. Google Cloud tarafında faturalandırma hesabı yine de zorunludur ve fiyat/kota koşulları yayına çıkmadan önce tekrar doğrulanmalıdır.

Ücretsiz Türkiye geneli klinik kapsamasını kalıcılaştırmak için OpenStreetMap sonuçları `OsmClinicIndex` tablosuna yazılır. Canlı arama yeni OSM sonuçlarını best-effort olarak indekse ekler; toplu doldurma için:

```bash
npm run osm:index
npm run osm:index -- --city=İstanbul
npm run osm:index -- --limit-cities=10 --delay-ms=2000
```

Bu indeks klinik sahiplik/kayıt akışı değildir; yalnızca OpenStreetMap açık verisini arama için yerelde cache'ler. Google puanı alanları varsa puan veya yorum sayısına göre sıralama yapılır; puan yoksa kartlar Google arama bağlantısı verir.

## Doğrulama

```bash
npm run lint
npm run test
npm run typecheck
npm run build
```

Canlılık ve bağımlılık kontrolleri ayrıdır:

- `GET /api/health/live`: uygulama işleminin ayakta olduğunu gösterir.
- `GET /api/health/ready`: PostgreSQL, Redis ve zorunlu ortam yapılandırması hazırsa `200` döner.

## Üretim dağıtımı

`.env.example` dosyasını temel alarak sunucuda, repoya eklenmeyen bir `.env.production` oluşturun. En az `APP_BASE_URL`, `BETTER_AUTH_URL`, `AUTH_ALLOWED_HOSTS`, güçlü auth/server-action anahtarları, yönetilen PostgreSQL `DATABASE_URL`, TLS kullanan Redis `REDIS_URL`, gerçek e-posta değerleri ve `LEGAL_CONTACT_EMAIL` tanımlayın.

```bash
docker compose -f docker-compose.production.yml build
docker compose -f docker-compose.production.yml up -d
docker compose -f docker-compose.production.yml ps
```

Konteyner başlangıcında `prisma migrate deploy` otomatik çalışır. Uygulama yalnızca `127.0.0.1:3000` üzerinde yayınlanır; internet erişimi için TLS sonlandıran Caddy, Nginx veya yönetilen yük dengeleyici kullanın. Kalıcı yayın için Cloudflare Quick Tunnel yerine özel alan adı ve sabit DNS kaydı bağlayın.

Canlıya geçmeden önce aşağıdaki kontrol listesini tamamlayın:

- `STRICT_RUNTIME_ENV=true` ile başlatın ve `/api/health/ready` yanıtının `200` olduğunu doğrulayın.
- `EMAIL_PROVIDER=resend`, doğrulanmış gönderen alan adı ve `EMAIL_REQUIRE_VERIFICATION=true` kullanın.
- Ücretli planlar açılacaksa iyzico canlı anahtarlarını ve webhook adresini tanımlayın.
- Places API (New) anahtarını sunucu IP'si/API kısıtları ve bütçe alarmıyla etkinleştirin; kayıtlı klinikleri doğrulanmış `place_id` ile eşleştirin.
- KVKK, gizlilik, çerez ve kullanım koşullarındaki veri sorumlusu unvanı, adresi ve iletişim bilgilerini hukuk uzmanı onayıyla kesinleştirin.
- Özel alan adı, TLS, yedekleme, hata izleme ve PostgreSQL geri yükleme tatbikatını tamamlayın.

## Klinik abonelikleri

Ücretsiz Başlangıç planı doğrudan etkinleştirilir. Ücretli Büyüme ve Profesyonel planları iyzico abonelik checkout formuna yönlenir; kart ve kimlik verileri DişçiBul veritabanında tutulmaz.

Üretimde aşağıdaki değerler zorunludur:

```bash
BILLING_PROVIDER=iyzico
IYZICO_API_BASE_URL=https://api.iyzipay.com
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_MERCHANT_ID=...
IYZICO_PLAN_GROWTH_REF=...
IYZICO_PLAN_PRO_REF=...
```

iyzico panelinde abonelik webhook adresini `https://alan-adiniz/api/billing/iyzico/webhook` olarak tanımlayın. Önce sandbox plan referanslarıyla checkout, callback, başarılı yenileme, başarısız yenileme ve iptal senaryolarını tamamlayın; canlı anahtarlara bundan sonra geçin.

## Dış servisler

Geliştirme ortamında e-posta, SMS ve WhatsApp adapterları gerçek kimlik bilgileri olmadan çalışacak şekilde ayrılmıştır. İnternet klinikleri OpenStreetMap topluluk verisinden alınır; servis erişilemezse veri uydurulmaz ve yalnızca DişçiBul klinikleri gösterilir. Üretim için yönetilen PostgreSQL, Redis, e-posta doğrulama sağlayıcısı, özel dosya depolama ve hata izleme ortam değerleri gerekir.

Sağlık dosyaları geliştirmede web kökünün dışındaki `.data/private` dizininde tutulur. Üretimde `OBJECT_STORAGE_PROVIDER=s3` ile özel bir S3 uyumlu bucket ve `FILE_SCAN_PROVIDER=clamav` ile zararlı içerik taraması kullanın; indirmeler yetkilendirilir ve denetim kaydına alınır.

## KVKK ve sağlık kapsamı

Platform teşhis koymaz. Fiyatlar bilgilendirme amaçlıdır ve kesin tedavi planı muayeneden sonra belirlenir. Depodaki hukuki metinler ürün yer tutucusudur; canlı ticari kullanımdan önce KVKK ve sağlık hukuku uzmanı tarafından onaylanmalıdır.
