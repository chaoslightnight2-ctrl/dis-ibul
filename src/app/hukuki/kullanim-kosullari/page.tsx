import { LegalPage } from "@/components/legal/legal-page";

export default function TermsPage() {
  return (
    <LegalPage title="Kullanım Koşulları">
      <section><h2 className="text-lg font-semibold text-slate-950">Platformun kapsamı</h2><p className="mt-2">DişçiBul klinik keşfi, fiyat karşılaştırması, teklif ve randevu talebi ile güvenli iletişim sağlar. Tıbbi tanı veya acil sağlık hizmeti sunmaz; kesin tedavi ve fiyat klinik muayenesiyle belirlenir.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Harita ve internet klinik verileri</h2><p className="mt-2">DişçiBul&apos;a kayıtlı olmayan kliniklerin konum ve iletişim bilgileri OpenStreetMap topluluk verisinden sağlanır ve <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline">OpenStreetMap katkıda bulunanları</a> atfıyla gösterilir. Bu veriler eksik veya güncelliğini yitirmiş olabilir; kullanıcı klinikle iletişime geçmeden önce bilgiyi doğrulamalıdır. DişçiBul bu kaynak için puan ya da yorum üretmez.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Kullanıcı sorumluluğu</h2><p className="mt-2">Doğru ve güncel bilgi vermeli, başka kişilerin verisini yetkisiz paylaşmamalı ve hesabınızı korumalısınız. Acil durumlarda platform yanıtını beklemeden 112&apos;ye veya uygun sağlık kuruluşuna başvurmalısınız.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Klinik sorumluluğu</h2><p className="mt-2">Klinikler ruhsat, hekim, fiyat, kampanya ve uygunluk bilgilerinin doğruluğundan; hasta verisini yalnızca sağlık hizmeti amacıyla ve mevzuata uygun işlemekten sorumludur. Yanıltıcı içerik askıya alınabilir.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Ücret ve iptal</h2><p className="mt-2">Hasta hesabı için platform kullanım ücreti alınmaz. Klinik abonelikleri seçilen plana göre aylık yenilenebilir; iptal sonrası yeni dönem tahsilatı yapılmaz ve mevcut dönem koşulları ödeme ekranında gösterilir.</p></section>
    </LegalPage>
  );
}
