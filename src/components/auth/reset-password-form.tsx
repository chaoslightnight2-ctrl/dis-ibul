"use client";

import Link from "next/link";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(token ? "" : "Bu bağlantı geçersiz veya süresi dolmuş.");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("passwordConfirm") || "")) {
      setSubmitting(false);
      setError("Şifreler aynı olmalı.");
      return;
    }

    const result = await authClient.resetPassword({ newPassword: password, token });
    setSubmitting(false);
    if (result.error) {
      setError("Bağlantı geçersiz, kullanılmış veya süresi dolmuş. Yeni bir bağlantı isteyin.");
      return;
    }
    setCompleted(true);
  }

  if (completed) {
    return (
      <div className="grid gap-4">
        <p role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">Şifreniz yenilendi. Güvenlik için diğer açık oturumlar kapatıldı.</p>
        <Link href="/auth/giris" className="inline-flex justify-center rounded-md bg-blue-700 px-4 py-2 font-semibold text-white">Giriş yap</Link>
      </div>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">Yeni şifre<input name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={!token} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950 disabled:bg-slate-100" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Yeni şifre tekrar<input name="passwordConfirm" type="password" autoComplete="new-password" minLength={10} maxLength={128} required disabled={!token} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950 disabled:bg-slate-100" /></label>
      <p className="text-xs text-slate-500">En az 10 karakterli, başka hesaplarda kullanmadığınız bir şifre seçin.</p>
      <button disabled={!token || submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">
        <KeyRound className="h-4 w-4" /> {submitting ? "Yenileniyor" : "Şifremi yenile"}
      </button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      {!token ? <Link href="/auth/sifremi-unuttum" className="text-sm font-semibold text-blue-700">Yeni bağlantı iste</Link> : null}
    </form>
  );
}
