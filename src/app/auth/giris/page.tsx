import Link from "next/link";
import { BarChart3, Building2, CalendarCheck, ClipboardList, Heart, UserRound } from "lucide-react";

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
  const destination = params.next ?? (isClinic ? "/panel/klinik?oturum=klinik" : "/panel/hasta?oturum=hasta");
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

            <form className="grid gap-4">
              <input type="hidden" name="accountType" value={selectedType} />
              {params.next ? <input type="hidden" name="next" value={params.next} /> : null}
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                E-posta
                <input type="email" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" placeholder={isClinic ? "klinik@example.com" : "hasta@example.com"} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Şifre
                <input type="password" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button type="button" disabled className="rounded-md bg-slate-300 px-3 py-2 font-semibold text-slate-700">
                  Güvenli giriş Faz 2&apos;de bağlanacak
                </button>
                <Link
                  href={destination}
                  className="rounded-md bg-blue-700 px-3 py-2 text-center font-semibold text-white hover:bg-blue-800"
                >
                  {isClinic ? "Klinik paneline gir" : "Hasta paneline gir"}
                </Link>
              </div>
            </form>

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
