export default function AdminPanelPage() {
  const metrics = ["Toplam kullanıcı", "Toplam klinik", "Bekleyen başvuru", "Google sync hatası", "Aktif fiyat kaydı", "İçerik bildirimi"];
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold">Admin paneli</h1>
      <p className="mt-1 text-sm text-slate-600">Moderasyon, doğrulama, katalog ve audit log için Faz 1 yerleşimi.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {metrics.map((metric, index) => (
          <div key={metric} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric}</p>
            <p className="mt-2 text-2xl font-semibold">{[128, 20, 7, 2, 100, 4][index]}</p>
          </div>
        ))}
      </div>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Öncelikli kuyruk</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>Klinik doğrulama başvuruları</li>
          <li>Yanlış Google eşleşmesi bildirimi</li>
          <li>Eski fiyat kayıtları ve yanıltıcı başlangıç fiyatı kontrolleri</li>
        </ul>
      </section>
    </main>
  );
}
