export default function ClinicPanelPage() {
  const items = ["Profil", "Şubeler", "Doktorlar", "Tedaviler", "Fiyatlar", "Randevular", "Teklif talepleri", "Google bağlantısı", "İstatistikler", "Güvenlik"];
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Klinik paneli</h1>
      <p className="mt-1 text-sm text-slate-600">MVP panel navigasyonu ve metrik yerleşimi.</p>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {items.map((item) => <div key={item} className="rounded-md border border-slate-200 bg-white p-4 font-medium shadow-sm">{item}</div>)}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["Profil görüntülenmesi", "Telefon tıklaması", "Teklif talebi", "Ortalama cevap süresi"].map((metric, index) => (
          <div key={metric} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric}</p>
            <p className="mt-2 text-2xl font-semibold">{[1240, 86, 31, "3 saat"][index]}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
