import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto min-h-[70vh] max-w-lg px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold text-blue-700">Hesap güvenliği</p>
      <h1 className="mt-2 text-3xl font-semibold text-blue-950">Şifrenizi yenileyin</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">Hesabınızdaki e-posta adresini yazın. Hesap varsa bir saat geçerli güvenli bağlantı göndereceğiz.</p>
      <section className="mt-6 rounded-lg border border-blue-100 bg-white p-6 shadow-sm"><ForgotPasswordForm /></section>
      <Link href="/auth/giris" className="mt-5 inline-flex text-sm font-semibold text-blue-700">Giriş ekranına dön</Link>
    </main>
  );
}
