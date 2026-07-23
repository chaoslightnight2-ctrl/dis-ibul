import Link from "next/link";
import { BarChart3, Building2, CalendarCheck, ClipboardList, Heart, UserRound } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ tip?: string; next?: string }>;
};

const patientPreview = [
  { label: "Randevu takibi", icon: CalendarCheck },
  { label: "Favori klinikler", icon: Heart },
  { label: "Teklif geçmişi", icon: ClipboardList },
];

const clinicPreview = [
  { label: "Hasta talepleri", icon: ClipboardList },
  { label: "Klinik istatistikleri", icon: BarChart3 },
  { label: "Profil ve fiyat yönetimi", icon: Building2 },
];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const selectedType = params.tip === "klinik" ? "klinik" : "hasta";
  const isClinic = selectedType === "klinik";
  const previewItems = isClinic ? clinicPreview : patientPreview;

  return (
    <main className="bg-blue-50/30">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700">Rol bazlı giriş</p>
          <h1 className="mt-2 text-3xl font-semibold text-blue-950">Hangi paneli kullanacaksınız?</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            Hasta girişi tamamen tedavi arayan kullanıcıya, klinik girişi ise diş hekimi ve klinik ekibine özel sayfalara yönlendirir.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="grid gap-3">
            <Link
              href="/auth/giris?tip=hasta"
              className={`rounded-lg border p-4 shadow-sm ${!isClinic ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <UserRound className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-950">Hasta girişi</p>
                  <p className="text-sm text-slate-600">Randevu, teklif, favori ve yorum takibi.</p>
                </div>
              </div>
            </Link>

            <Link
              href="/auth/giris?tip=klinik"
              className={`rounded-lg border p-4 shadow-sm ${isClinic ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-950">Diş hekimi / klinik girişi</p>
                  <p className="text-sm text-slate-600">Talepler, fiyatlar, doktorlar ve performans.</p>
                </div>
              </div>
            </Link>
          </aside>

          <section className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              {isClinic ? <Building2 className="h-6 w-6 text-blue-700" /> : <UserRound className="h-6 w-6 text-blue-700" />}
              <div>
                <h2 className="text-xl font-semibold text-blue-950">
                  {isClinic ? "Klinik hesabına giriş" : "Hasta hesabına giriş"}
                </h2>
                <p className="text-sm text-slate-600">
                  {isClinic
                    ? "Girişten sonra klinik istatistikleri, hasta talepleri ve profil yönetimi açılır."
                    : "Girişten sonra kişisel tedavi takibi, randevu istekleri ve favori klinikler açılır."}
                </p>
              </div>
            </div>

            <LoginForm accountType={selectedType} next={params.next} />

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {previewItems.map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-md border border-blue-100 bg-blue-50 p-3">
                  <Icon className="h-4 w-4 text-blue-700" />
                  <p className="mt-2 text-sm font-medium text-blue-950">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link href={`/auth/kayit?tip=${selectedType}`} className="font-semibold text-blue-700">Yeni hesap oluştur</Link>
              <Link href={isClinic ? "/auth/kayit?tip=klinik" : "/arama"} className="font-semibold text-slate-700">
                {isClinic ? "Klinik başvurusu yap" : "Üye olmadan klinik ara"}
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
