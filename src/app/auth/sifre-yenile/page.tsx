import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type ResetPasswordPageProps = { searchParams: Promise<{ token?: string; error?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.error ? undefined : params.token;
  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold text-blue-700">Hesap güvenliği</p>
      <h1 className="mt-2 text-3xl font-semibold text-blue-950">Yeni şifre belirleyin</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Şifreniz değiştiğinde hesabınızdaki diğer açık oturumlar kapatılır.</p>
      <section className="mt-6 rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><ResetPasswordForm token={token} /></section>
    </main>
  );
}
