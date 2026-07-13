import Link from "next/link";
import { Building2, UserRound } from "lucide-react";

type LoginPageProps = {
  searchParams: Promise<{ tip?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const selectedType = params.tip === "klinik" ? "klinik" : "hasta";
  const isClinic = selectedType === "klinik";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-950">Giriş</h1>
        <p className="mt-2 text-slate-600">
          Diş hizmeti almak isteyen hastalar ve klinik/diş hekimi ekipleri için ayrı giriş akışları.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-3">
          <Link
            href="/auth/giris?tip=hasta"
            className={`rounded-lg border p-4 shadow-sm ${!isClinic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-teal-700" />
              <div>
                <p className="font-semibold text-slate-950">Hasta girişi</p>
                <p className="text-sm text-slate-600">Klinik arama, favori, karşılaştırma, randevu ve teklif talepleri.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/auth/giris?tip=klinik"
            className={`rounded-lg border p-4 shadow-sm ${isClinic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-teal-700" />
              <div>
                <p className="font-semibold text-slate-950">Diş hekimi / klinik girişi</p>
                <p className="text-sm text-slate-600">Klinik profili, doktorlar, fiyatlar, Google bağlantısı ve talepler.</p>
              </div>
            </div>
          </Link>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            {isClinic ? <Building2 className="h-6 w-6 text-teal-700" /> : <UserRound className="h-6 w-6 text-teal-700" />}
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {isClinic ? "Diş hekimi / klinik hesabı" : "Hasta hesabı"}
              </h2>
              <p className="text-sm text-slate-600">
                {isClinic
                  ? "Klinik yöneticisi veya diş hekimi paneline giriş için kullanılacak."
                  : "Tedavi arayan kullanıcıların randevu ve teklif talepleri için kullanılacak."}
              </p>
            </div>
          </div>

          <form className="grid gap-4">
            <input type="hidden" name="accountType" value={selectedType} />
            {params.next ? <input type="hidden" name="next" value={params.next} /> : null}
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              E-posta
              <input type="email" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" placeholder={isClinic ? "klinik@example.com" : "hasta@example.com"} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Şifre
              <input type="password" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
            </label>
            <button type="button" disabled className="rounded-md bg-slate-300 px-3 py-2 font-semibold text-slate-700">
              {"Güvenli giriş Faz 2'de bağlanacak"}
            </button>
          </form>

          <div className="mt-5 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
            {isClinic ? (
              <p>Klinik hesabı için e-posta/telefon doğrulama, belge yükleme, Google işletme eşleştirme ve moderasyon onayı Faz 2 akışında bağlanacak.</p>
            ) : (
              <p>Hasta hesabı için favoriler, karşılaştırma listesi, randevu/teklif geçmişi ve bildirim tercihleri Faz 2 akışında bağlanacak.</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <Link href="/auth/kayit" className="font-semibold text-teal-700">Yeni hesap oluştur</Link>
            <Link href="/arama" className="font-semibold text-slate-700">Üye olmadan klinik ara</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
