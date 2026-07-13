# DişçiBul

Türkiye'de başlayıp farklı ülkelere açılabilecek diş hekimi ve diş kliniği keşif, karşılaştırma, fiyat araştırma ve hasta-klinik eşleştirme platformu.

## Faz 1 Durumu

Bu sürüm çalışan Next.js MVP omurgasını içerir:

- Responsive ana sayfa, arama, klinik profili, doktor profili, karşılaştırma, klinik paneli ve admin paneli.
- Mock klinik verisiyle şehir, tedavi, fiyat ve Google puanı filtreleme.
- Google provider interface ve mock adapter.
- Google yorum butonu dış Google linkine yönlenir; yerel yorum veya sahte puan üretmez.
- Randevu ve teklif talebi API sözleşmeleri Zod ile doğrulanır.
- PostgreSQL/PostGIS hedefli Prisma schema taslağı.
- Docker Compose ile Postgres + Redis geliştirme servisleri.

## Kurulum

```bash
npm install
cp .env.example .env
docker compose up -d
npm run prisma:generate
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde çalışır.

## Doğrulama

```bash
npm run lint
npm run test
npm run build
```

## Google Entegrasyonu

Geliştirme ortamında `GOOGLE_PROVIDER=mock` kullanılır. Gerçek Google Maps/Business entegrasyonu için `.env` içine `GOOGLE_PROVIDER=google`, `GOOGLE_MAPS_API_KEY` ve OAuth bilgileri eklenecek; provider implementasyonu `src/services/google` altında genişletilecektir.

Google puanı platform tarafından yeniden hesaplanmaz. Google verisi alınamazsa UI "Google puanı şu anda alınamıyor" mesajı gösterir.

## KVKK ve Sağlık Uyarısı

Hukuki metinler placeholder kabul edilmelidir. Canlıya geçmeden önce KVKK, sağlık verisi işleme, açık rıza, çerez ve pazarlama izinleri hukuk uzmanı tarafından incelenmelidir.

## Belgeler

Başlangıç mimarisi, MVP kapsamı, veri modeli, route listesi, yetki matrisi ve görev listesi için [docs/architecture.md](docs/architecture.md) dosyasına bakın.
