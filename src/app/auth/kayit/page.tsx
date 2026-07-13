import Link from "next/link";
import { Building2, UserRound } from "lucide-react";

type RegisterPageProps = {
  searchParams: Promise<{ tip?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const selectedType = params.tip === "klinik" ? "klinik" : "hasta";
  const isClinic = selectedType === "klinik";

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-950">Kayıt</h1>
        <p className="mt-2 text-slate-600">
          Hasta ve klinik/diş hekimi kayıt akışları ayrıdır; demo sürümde form sözleşmesi ve yönlendirme hazırdır.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-3">
          <Link
            href="/auth/kayit?tip=hasta"
            className={`rounded-lg border p-4 shadow-sm ${!isClinic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-teal-700" />
              <div>
                <p className="font-semibold text-slate-950">Hasta kaydı</p>
                <p className="text-sm text-slate-600">Randevu, teklif, favori ve karşılaştırma takibi için.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/auth/kayit?tip=klinik"
            className={`rounded-lg border p-4 shadow-sm ${isClinic ? "border-teal-300 bg-teal-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-teal-700" />
              <div>
                <p className="font-semibold text-slate-950">Diş hekimi / klinik kaydı</p>
                <p className="text-sm text-slate-600">Klinik profili, fiyatlar, doktorlar ve talepler için.</p>
              </div>
            </div>
          </Link>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            {isClinic ? <Building2 className="h-6 w-6 text-teal-700" /> : <UserRound className="h-6 w-6 text-teal-700" />}
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {isClinic ? "Klinik / diş hekimi hesabı oluştur" : "Hasta hesabı oluştur"}
              </h2>
              <p className="text-sm text-slate-600">
                {isClinic ? "Yayın öncesi moderasyon ve belge kontrolü gerektirir." : "Teklif ve randevu taleplerinizi tek yerden takip edin."}
              </p>
            </div>
          </div>

          <form className="grid gap-4">
            <input type="hidden" name="accountType" value={selectedType} />
            {isClinic ? (
              <>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Klinik veya muayenehane adı
                  <input className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" placeholder="Örn. Mavi Gülüş Kliniği" />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">
                  Yetkili kişi
                  <input className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
                </label>
              </>
            ) : (
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Ad soyad
                <input className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
              </label>
            )}
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              E-posta
              <input type="email" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">
              Telefon
              <input inputMode="tel" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-1" />
              KVKK aydınlatma metnini okudum ve hesap oluşturma süreci için verilerimin işlenmesini kabul ediyorum.
            </label>
            {isClinic ? (
              <label className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-1" />
                Klinik bilgilerinin moderasyon incelemesinden sonra yayınlanacağını kabul ediyorum.
              </label>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" disabled className="rounded-md bg-slate-300 px-3 py-2 font-semibold text-slate-700">
                {"Güvenli kayıt Faz 2'de bağlanacak"}
              </button>
              <Link
                href={isClinic ? "/panel/klinik?demo=klinik" : "/arama?demo=hasta"}
                className="rounded-md bg-teal-700 px-3 py-2 text-center font-semibold text-white hover:bg-teal-800"
              >
                Demo akışa devam et
              </Link>
            </div>
          </form>

          <p className="mt-5 text-sm text-slate-600">
            Zaten hesabınız varsa <Link href={`/auth/giris?tip=${selectedType}`} className="font-semibold text-teal-700">giriş ekranına dönün</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
