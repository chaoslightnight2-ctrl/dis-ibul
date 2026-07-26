import Link from "next/link";
import { UserRound } from "lucide-react";
import { PatientRegistrationForm } from "@/components/auth/patient-registration-form";

type RegisterPageProps = {
  searchParams: Promise<{ tip?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  await searchParams;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-slate-950">Kayıt</h1>
        <p className="mt-2 text-slate-600">
          Diş kliniği arayan kullanıcılar için hesap oluşturun. Bilgileriniz güvenli oturum ve kalıcı kayıt altyapısıyla korunur.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="grid gap-3">
          <Link
            href="/auth/kayit?tip=hasta"
            className="rounded-lg border border-blue-300 bg-blue-50 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-blue-700" />
              <div>
                <p className="font-semibold text-slate-950">Kullanıcı kaydı</p>
                <p className="text-sm text-slate-600">Klinik arama, favori ve karşılaştırma takibi için.</p>
              </div>
            </div>
          </Link>
        </aside>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <UserRound className="h-6 w-6 text-blue-700" />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Kullanıcı hesabı oluştur</h2>
              <p className="text-sm text-slate-600">Klinikleri arayın, favorilerinizi saklayın ve taleplerinizi takip edin.</p>
            </div>
          </div>

          <PatientRegistrationForm />

          <p className="mt-5 text-sm text-slate-600">
            Zaten hesabınız varsa <Link href="/auth/giris" className="font-semibold text-blue-700">giriş ekranına dönün</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
