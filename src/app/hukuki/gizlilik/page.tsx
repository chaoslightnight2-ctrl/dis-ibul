import { LegalPage } from "@/components/legal/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPage title="Gizlilik Politikası">
      <section><h2 className="text-lg font-semibold text-slate-950">Gizlilik yaklaşımı</h2><p className="mt-2">DişçiBul, hasta taleplerini yalnızca talebin yöneltildiği kliniklerle paylaşır. Klinik ekipleri yalnızca bağlı oldukları klinik verilerine erişebilir; erişim ve önemli yönetim işlemleri denetim kaydına alınır.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Hesap ve güvenlik</h2><p className="mt-2">Parolalar açık metin saklanmaz. Oturum, hız sınırlama, kaynak doğrulama ve rol tabanlı yetkilendirme kontrolleri uygulanır. Şüpheli erişimi bildirmek için destek adresini kullanabilirsiniz.</p></section>
      <section>
        <h2 className="text-lg font-semibold text-slate-950">OpenStreetMap ve üçüncü taraf bağlantıları</h2>
        <p className="mt-2">İnternet klinik araması, kullanıcının seçtiği şehir veya ilçe için OpenStreetMap Nominatim ve Overpass servislerine konum sorgusu gönderir. İşletme adı, adres, koordinat, telefon, web sitesi, çalışma saati ve erişilebilirlik bilgisi mevcut olduğu ölçüde görüntülenir. Arama sonuçları servis yükünü azaltmak amacıyla sınırlı süre önbelleğe alınabilir.</p>
        <p className="mt-2">OpenStreetMap verileri <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="font-medium text-blue-700 underline">ODbL lisansı ve OpenStreetMap katkıda bulunanları</a> atfıyla kullanılır. “Google&apos;da ara” bağlantısı sizi Google Maps&apos;e yönlendirir; bu dış sayfada Google&apos;ın kendi gizlilik koşulları geçerlidir. Kayıtlı bir klinik yöneticisi doğrulanmış Google İşletme Profili&apos;ni açıkça bağlarsa puan, değerlendirme sayısı ve en son 50 yorum sınırlı süreyle saklanıp klinik profilinde gösterilebilir. Google bağlantısı kaldırıldığında bu yorum önbelleği silinir.</p>
      </section>
      <section><h2 className="text-lg font-semibold text-slate-950">Diğer sağlayıcılar</h2><p className="mt-2">Abonelik ödemeleri etkinleştirildiğinde iyzico&apos;nun güvenli ödeme sayfasında tamamlanır. Bu hizmetlerin kendi gizlilik koşulları geçerlidir.</p></section>
      <section><h2 className="text-lg font-semibold text-slate-950">Kontrolünüz</h2><p className="mt-2">Bildirim ve iletişim tercihlerinizi değiştirebilir, verinizi dışa aktarabilir, hesabın silinmesini isteyebilir ve analitik çerez iznini dilediğiniz zaman geri çekebilirsiniz.</p></section>
    </LegalPage>
  );
}
