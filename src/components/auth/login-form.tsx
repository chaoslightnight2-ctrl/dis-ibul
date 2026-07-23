"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

type LoginFormProps = { accountType: "hasta" | "klinik"; next?: string };

export function LoginForm({ accountType, next }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      rememberMe: true,
    });

    if (result.error) {
      setSubmitting(false);
      setError("E-posta veya şifre hatalı. Bilgilerinizi kontrol edin.");
      return;
    }

    const response = await fetch("/api/me", { cache: "no-store" });
    if (!response.ok) {
      setSubmitting(false);
      setError("Oturum açılamadı. Lütfen yeniden deneyin.");
      return;
    }

    const data = (await response.json()) as { user: { role: string }; destination: string };
    const wrongPanel = accountType === "hasta" ? data.user.role !== "PATIENT" : data.user.role === "PATIENT";
    if (wrongPanel) {
      await authClient.signOut();
      setSubmitting(false);
      setError(accountType === "hasta" ? "Bu hesap bir klinik hesabı. Klinik girişini kullanın." : "Bu hesap bir hasta hesabı. Hasta girişini kullanın.");
      return;
    }

    router.push(next && next.startsWith("/") ? next : data.destination);
    router.refresh();
  }

  return (
    <form method="post" onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        E-posta
        <input name="email" type="email" autoComplete="email" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" placeholder={accountType === "klinik" ? "klinik@example.com" : "hasta@example.com"} />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Şifre
        <input name="password" type="password" autoComplete="current-password" minLength={10} required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
      </label>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href="/auth/sifremi-unuttum" className="font-semibold text-blue-700">Şifremi unuttum</Link>
        <Link href="/auth/eposta-dogrula" className="font-semibold text-slate-600">Doğrulama e-postası iste</Link>
      </div>
      <button disabled={submitting} className="rounded-md bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
        {submitting ? "Giriş yapılıyor" : accountType === "klinik" ? "Klinik paneline gir" : "Hasta paneline gir"}
      </button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
