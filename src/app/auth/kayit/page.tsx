export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Kayıt</h1>
        <p className="mt-1 text-sm text-slate-600">Hasta ve klinik kayıt akışının form sözleşmesi hazırlandı; kalıcı auth Faz 2 kapsamındadır.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {["Hasta hesabı", "Klinik hesabı"].map((title) => (
            <div key={title} className="rounded-md border border-slate-200 p-4">
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-slate-600">E-posta doğrulama, KVKK rızası ve rol ataması ile açılacak.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
