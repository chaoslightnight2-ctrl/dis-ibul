# DişçiBul Türkiye Geneli Arama ve Bugfix Raporu

Tarih: 20 Temmuz 2026

## Tamamlanan ürün işleri

- Arama ekranı 81 ilin tamamını içeren doğrulanmış şehir listesine bağlandı.
- İnternet araması şehir bazında Google Places veya ücretsiz OpenStreetMap sağlayıcısıyla çalışacak hibrit yapıya geçirildi.
- Google Places etkinleştirildiğinde puan, değerlendirme sayısı, telefon ve en fazla beş yorum gösterilecek; servis kapalı, erişilemez veya kota doluysa OpenStreetMap'e dönülecek.
- Google Places arama ve detay isteklerine ayrı 900/ay sert koruma kotası, dakika kotası ve Redis/bellek önbelleği eklendi.
- Klinik yöneticileri her tedaviyi `Yapılıyor`, `Yapılmıyor` veya `Belirtilmedi` olarak yönetebiliyor. Aktif fiyatı olan tedavinin olumsuz veya bilinmiyor durumuna alınması API düzeyinde engelleniyor.
- Kayıtlı klinik kartları yapılan ve yapılmayan tedavileri açık klinik beyanı olarak gösteriyor. Dış kaynaklarda eksik tedavi bilgisi yanlışlıkla `yapamıyor` diye yorumlanmıyor.
- Telefon bulunan kliniklere Android ve iPhone uyumlu `Ara` (`tel:`), `Mesaj at` (`sms:`) ve uygun kayıtlarda WhatsApp eylemleri eklendi.
- Arama çubuğunun hemen altında klinikler gösteriliyor; sık arananlar yalnızca arama alanı odaklandığında açılıyor.

## Ücretsiz resmi Google yorum yöntemi

Kayıtlı klinikler için Google Business Profile OAuth entegrasyonu tamamlandı:

- Klinik yöneticisi yalnızca Google hesabında yönetebildiği işletmeleri görebilir.
- Seçilen konum sunucuda Google'dan yeniden doğrulanmadan kaydedilemez.
- Puan, toplam değerlendirme sayısı, en son 50 yorum ve klinik yanıtları resmi Business Profile API üzerinden alınır; profil sayfasında en son 5 yorum gösterilir.
- Yenileme anahtarı AES-256-GCM ile kliniğe bağlı olarak şifrelenir. OAuth durum değeri Redis'te 10 dakika geçerli ve tek kullanımlıktır.
- Bağlantı kaldırıldığında Google erişimi iptal edilmeye çalışılır ve yerel yorum önbelleği silinir.
- Yetkilendirme, konum seçme, senkronizasyon ve bağlantıyı kaldırma işlemleri audit log'a yazılır.

Business Profile API kullanım başına ücret almaz ancak yalnızca kliniğin sahibi/yöneticisi olduğu doğrulanmış profillerde çalışır. Google Cloud projesinin Business Profile API erişimi için Google tarafından onaylanması, OAuth istemcisi ve klinik izni gerekir. Türkiye'deki rastgele tüm işletmelerin yorumlarını anahtarsız ve sınırsız veren resmi bir Google API yoktur.

## Kullanıcı gözüyle düzeltilen hatalar

1. Seçili şehir ve kaynak filtresi iki arama alanı arasında kayboluyordu; iki alan artık aynı URL durumunu koruyor.
2. Telefon metni küçük ve yinelenen bir dokunma hedefiydi; yalnızca en az 40 px yüksekliğindeki belirgin eylemler bırakıldı.
3. Tedavi kaydının olmaması yanlışlıkla `yapılmıyor` anlamına gelebiliyordu; bilinmeyen ve açık olumsuz beyan ayrıldı.
4. Google anahtar, servis ve kota hataları kullanıcıya anlaşılır durumlar olarak gösteriliyor; puan veya yorum üretilmiyor.
5. Standalone üretim paketinde JavaScript/CSS varlıkları eksikti. `postbuild` adımı `.next/static` ve `public` varlıklarını standalone pakete otomatik ekliyor.
6. JavaScript yüklenmediğinde istemci formları varsayılan GET gönderimi yapabiliyordu; giriş denemesinde parola URL'ye taşınabiliyordu. Tüm istemci formları `method="post"` ile güvenli başarısızlık davranışına alındı.
7. Klinik paneli iPhone genişliğinde 86 px yatay taşıyordu. Ana grid kolonları ve form kontrolleri daralabilir/tam genişlik olacak şekilde düzeltildi.
8. Google işletme seçicisindeki uzun klinik adı mobilde genişliği büyütebiliyordu; select kontrolü ekran genişliğiyle sınırlandı.

## Doğrulama

- PostgreSQL migration: `20260720213000_google_business_oauth` başarıyla uygulandı.
- Prisma Client üretimi ve schema format: başarılı.
- ESLint: başarılı.
- TypeScript/Next.js typecheck: başarılı.
- Birim testleri: 13 dosyada 63/63 başarılı.
- Üretim derlemesi: başarılı; 68 sayfa veri birimi üretildi ve standalone statik varlık adımı geçti.
- Önceki uçtan uca tarayıcı paketi: masaüstü, iPhone 13 ve Android Pixel 7 projelerinde 18/18 başarılı.
- Güncel gerçek tarayıcı testi: klinik girişi, rol bazlı yönlendirme ve panel açılışı başarılı; parola URL'ye taşınmıyor ve form yöntemi `POST`.
- Google panel testi: kimlik bilgileri yokken güvenli yapılandırılmamış durum gösteriliyor; sahte puan veya bağlantı görünmüyor.
- iPhone 390x844: sayfa genişliğinde yatay taşma yok.
- Android 412x915: sayfa genişliğinde yatay taşma yok; paneldeki tüm formlar `POST`.
- Masaüstü: 82 şehir seçeneği, 3 doğrudan klinik kartı, arama odağında sık arananlar ve sıfır konsol hatası doğrulandı.
- Önceki canlı OpenStreetMap testi: Ankara için 30 dış klinik ve 18 ara/mesaj eylemi doğrulandı. Son yerel sandbox turunda dış ağ kapalı olduğu için OpenStreetMap'in anlaşılır hata/geri dönüş durumu ayrıca doğrulandı.
- PostgreSQL ve Redis: erişilebilir.

## Mevcut dış servis durumu

- `GOOGLE_PROVIDER=mock`; Google Places API anahtarı tanımlı değil. Uygulama Google puanı uydurmuyor.
- Google Business OAuth istemci bilgileri ve 32 baytlık şifreleme anahtarı henüz tanımlı değil. Entegrasyon hazır fakat gerçek klinik hesabıyla bağlantı bu bilgiler ve Google proje onayı olmadan başlatılamaz.
- Ücretsiz klinik/telefon keşfi OpenStreetMap ile çalışır. OpenStreetMap yorum veya puan sağlamaz.

## Canlı adres

Yerel üretim sunucusu çalışıyor. Önceki Cloudflare Quick Tunnel adresinin DNS kaydı sona erdi. Yeni tünel oluşturma işlemi çalışma ortamının dış ağ onayı beklediği için yeni adres henüz yazılmadı.
