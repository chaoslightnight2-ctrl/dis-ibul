import Link from "next/link";
import { Building2, UserRound } from "lucide-react";
import { ClinicApplicationForm } from "@/components/auth/clinic-application-form";
import { PatientRegistrationForm } from "@/components/auth/patient-registration-form";

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
          Hasta ve klinik hesapları farklı yetkilerle açılır. Bilgileriniz güvenli oturum ve kalıcı kayıt altyapısıyla korunur.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-3">
          <Link
            href="/auth/kayit?tip=hasta"
            className={`rounded-lg border p-4 shadow-sm ${!isClinic ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold text-slate-950">Hasta kaydı</p>
                <p className="text-sm text-slate-600">Randevu, teklif, favori ve karşılaştırma takibi için.</p>
              </div>
            </div>
          </Link>

          <Link
            href="/auth/kayit?tip=klinik"
            className={`rounded-lg border p-4 shadow-sm ${isClinic ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold text-slate-950">Diş hekimi / klinik kaydı</p>
                <p className="text-sm text-slate-600">Klinik profili, fiyatlar, doktorlar ve talepler için.</p>
              </div>
            </div>
          </Link>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            {isClinic ? <Building2 className="h-6 w-6 text-blue-700" /> : <UserRound className="h-6 w-6 text-blue-700" />}
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {isClinic ? "Klinik / diş hekimi hesabı oluştur" : "Hasta hesabı oluştur"}
              </h2>
              <p className="text-sm text-slate-600">
                {isClinic ? "Yayın öncesi moderasyon ve belge kontrolü gerektirir." : "Teklif ve randevu taleplerinizi tek yerden takip edin."}
              </p>
            </div>
          </div>

          {isClinic ? (
            <ClinicApplicationForm />
          ) : (
            <PatientRegistrationForm />
          )}

          <p className="mt-5 text-sm text-slate-600">
            Zaten hesabınız varsa <Link href={`/auth/giris?tip=${selectedType}`} className="font-semibold text-blue-700">giriş ekranına dönün</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
