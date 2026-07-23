import Link from "next/link";
import { VerificationEmailForm } from "@/components/auth/verification-email-form";

type VerifyEmailPageProps = { searchParams: Promise<{ email?: string }> };

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold text-blue-700">Hesap güvenliği</p>
      <h1 className="mt-2 text-3xl font-semibold text-blue-950">E-postanızı doğrulayın</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Bağlantı bir gün geçerlidir. Eski bağlantınız çalışmıyorsa yenisini isteyin.</p>
      <section className="mt-6 rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><VerificationEmailForm initialEmail={params.email} /></section>
      <Link href="/auth/giris" className="mt-5 inline-flex text-sm font-semibold text-blue-700">Giriş ekranına dön</Link>
    </main>
  );
}
