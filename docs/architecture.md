# DişçiBul Başlangıç Çıktıları

## 1. Proje Mimarisi

DişçiBul, ilk sürümde Next.js App Router tabanlı modüler monolit olarak kuruldu. UI, server route handler, domain servisleri ve repository/provider katmanları aynı kod tabanında tutulur; Google, e-posta, SMS, WhatsApp, storage, search ve analytics dış servisleri adapter interface ile ayrılır. Böylece MVP hızlı çıkar, ileride NestJS veya ayrı servis mimarisine taşınacak sınırlar korunur.

Ana katmanlar:

- `src/app`: sayfalar, route handlerlar, SEO entrypointleri.
- `src/components`: tekrar kullanılabilir UI ve domain bileşenleri.
- `src/domain`: roller, statüler, validasyon sözleşmeleri ve domain tipleri.
- `src/services`: Google, search, notification gibi provider interface ve mock/real adapterlar.
- `src/data`: MVP mock veri ve ileride repository implementasyonları.
- `prisma`: PostgreSQL/PostGIS için kalıcı veri modeli.

## 2. MVP Kapsamı

MVP şunları kapsar: hasta/klinik kayıt ekranları, rol temeli, klinik ve doktor profilleri, tedavi kataloğu, klinik fiyat gösterimi, şehir/ilçe/tedavi/fiyat filtreleme, Google Place ID eşleşme sözleşmesi, Google puanı gösterimi ve dış yorum linki, favori/karşılaştırma akışı, randevu ve teklif talebi API iskeleti, klinik paneli, admin paneli, responsive tasarım, seed/mock veri, Docker geliştirme ortamı, `.env.example`, kurulum dokümanı ve temel testler.

MVP dışı ama mimariye hazır: gerçek Google Business OAuth, ödeme, gelişmiş mesajlaşma, zararlı dosya taraması, production queue işçileri, sponsorlu sıralama optimizasyonu, çok ülkeli fiyat/para politikaları.

## 3. Veritabanı Modeli

Çekirdek model `User -> profile/roles`, `Clinic -> branches/team/doctors/treatments/prices/google connection`, `Dentist -> specialties/education/certificates`, `TreatmentCategory -> Treatment`, `AppointmentRequest`, `QuoteRequest -> selected clinics/responses`, `Conversation/Message`, `VerificationApplication/Document`, `Report/ModerationAction`, `Subscription/Payment`, `AnalyticsEvent/SearchLog/AuditLog/ConsentRecord` şeklindedir.

Önemli kurallar:

- Para değerleri `Decimal` ile tutulur, floating point kullanılmaz.
- Google puanı yerel bağımsız puan değildir; `GooglePlaceConnection` içinde kaynak, sync zamanı ve hata statüsüyle tutulur.
- Sağlık dosyaları ve doğrulama belgeleri public URL ile değil private object key ile saklanır.
- Klinik, doktor, Google Place ID, şehir/ilçe, fiyat, rating, verification ve publish statülerine index eklenir.
- PostGIS için Prisma şemasında koordinat alanları tutulur; production migrationda `geography(Point,4326)` generated/raw migration ile eklenir.

## 4. Route Listesi

- `/`: ana arama ve keşif.
- `/arama`: liste/harita arama deneyimi.
- `/klinikler/[slug]`: klinik profili.
- `/doktorlar/[slug]`: doktor profili.
- `/karsilastir`: en fazla dört klinik karşılaştırma.
- `/auth/giris`, `/auth/kayit`: giriş/kayıt ekranları.
- `/panel/klinik`: klinik paneli MVP özeti.
- `/panel/admin`: admin/moderasyon paneli MVP özeti.
- `/api/clinics`: filtrelenmiş klinik arama.
- `/api/appointment-requests`: randevu talebi.
- `/api/quote-requests`: fiyat teklifi talebi.
- `/api/google/review-link`: Google yorum dış link doğrulama.
- `/api/health`: sağlık kontrolü.

## 5. Uygulama Klasör Yapısı

```txt
src/
  app/
  components/
  config/
  data/
  domain/
  lib/
  services/
prisma/
docs/
tests/
```

## 6. Kullanıcı Akışları

- Hasta arama akışı: ana sayfa -> tedavi/konum arama -> filtre -> klinik profili -> karşılaştırma veya teklif/randevu talebi.
- Google değerlendirme akışı: klinik profili -> Google'da değerlendirme butonu -> `/api/google/review-link` doğrulaması -> Google Maps dış bağlantısı.
- Klinik kayıt akışı: kayıt -> klinik profil taslağı -> Google eşleşme -> doktor/fiyat ekleme -> moderasyon.
- Admin akışı: başvuru kuyruğu -> belge kontrolü -> doğrulama veya ek belge isteği -> audit log.

## 7. Yetki Matrisi Özeti

| İşlem | Ziyaretçi | Hasta | Hekim | Klinik yöneticisi | Moderatör | Süper admin |
| --- | --- | --- | --- | --- | --- | --- |
| Klinik arama | Evet | Evet | Evet | Evet | Evet | Evet |
| Favori/karşılaştırma kaydı | Hayır | Evet | Hayır | Hayır | Evet | Evet |
| Randevu/teklif talebi | Giriş gerekir | Evet | Hayır | Hayır | Evet | Evet |
| Klinik profili düzenleme | Hayır | Hayır | Kısıtlı | Kendi kliniği | Evet | Evet |
| Fiyat yönetimi | Hayır | Hayır | Yetkiyle | Kendi kliniği | İnceleme | Evet |
| Google eşleşme düzeltme | Hayır | Hayır | Hayır | Kendi kliniği | Evet | Evet |
| Belge doğrulama | Hayır | Hayır | Hayır | Başvuru | Evet | Evet |
| Audit log görme | Hayır | Hayır | Hayır | Kendi kliniği | Evet | Evet |

## 8. API Endpoint Listesi

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/health` | runtime ve env sağlık kontrolü |
| GET | `/api/clinics` | klinik arama ve filtreleme |
| POST | `/api/appointment-requests` | randevu talebi oluşturma |
| POST | `/api/quote-requests` | fiyat teklifi talebi oluşturma |
| GET | `/api/google/review-link?clinicSlug=` | güvenli Google yorum linki döndürme |

## 9. Google Entegrasyon Tasarımı

Google verisi `GoogleProvider` interface üzerinden alınır. `MockGoogleProvider` geliştirme ve demo için kullanılır; demo puanları açıkça örnek veri kabul edilir. Gerçek provider yalnızca API anahtarı/OAuth ayarları olduğunda etkinleşir. Uygulama Google puanını yeniden hesaplamaz, sahte yorum üretmez, kullanıcıyı doğrudan Google yorum linkine yönlendirir ve Google verisi alınamadığında yerel puan uydurmaz.

## 10. Güvenlik ve KVKK Kontrol Listesi

- RBAC ve resource ownership her endpointte uygulanacak.
- Sağlık verileri private storage, signed URL ve erişim logu ile korunacak.
- ConsentRecord içinde rıza türü, versiyon, IP ve zaman damgası tutulacak.
- Fiyat/teklif ekranlarında teşhis koymama ve muayene sonrası kesinleşme uyarısı gösterilecek.
- Dosya boyutu/tipi doğrulaması ve malware scanning adapterı eklenecek.
- Loglarda kişisel/sağlık verisi tutulmayacak.
- API pagination ve rate limiting zorunlu olacak.

## 11. MVP ve Sonraki Faz Ayrımı

MVP, kullanıcıya arama/profil/karşılaştırma/talep oluşturma dikey kesitini verir. Sonraki fazlar gerçek auth, kalıcı veri CRUD, Google sync jobları, klinik operasyon paneli, admin moderasyon ve gelişmiş SEO/performance işlerini tamamlar.

## 12. İlk Geliştirme Adımları

1. Faz 1: proje kurulumu, env doğrulama, marka ayarı, temel layout, Prisma taslağı, mock veri, Google adapter, arama API, temel test.
2. Faz 2: gerçek auth, RBAC middleware, klinik/doktor CRUD ve belge doğrulama.
3. Faz 3: tedavi/fiyat yönetimi, stale price job, moderasyon.
4. Faz 4: Postgres full-text/trigram ve PostGIS mesafe sorguları.
5. Faz 5: gerçek Google Places/Business adapter ve cache/sync job.
6. Faz 6: hasta favori, randevu, teklif, mesajlaşma ve bildirimler.
7. Faz 7: klinik/admin panellerinin operasyonel hale getirilmesi.
8. Faz 8: E2E, SEO, erişilebilirlik, performans ve güvenlik denetimleri.

## 13. Geliştirme Görev Listesi

- Auth provider seçimi ve session modeli.
- RBAC guard ve route middleware.
- Prisma migration üretimi.
- Seed verisinin 20 klinik/35 doktor kapsamına genişletilmesi.
- Klinik/doktor CRUD ekranları.
- Fiyat stale kontrol jobı.
- Google sync job ve cache politikası.
- Playwright E2E akışları.
