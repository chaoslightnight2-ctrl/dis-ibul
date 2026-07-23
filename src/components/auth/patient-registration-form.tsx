"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function PatientRegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password !== String(form.get("passwordConfirm") || "")) {
      setSubmitting(false);
      setError("Şifreler aynı olmalı.");
      return;
    }

    const result = await authClient.signUp.email({
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password,
      callbackURL: "/auth/eposta-dogrulandi",
    });
    if (result.error) {
      setSubmitting(false);
      setError("Hesap oluşturulamadı. E-posta kullanılıyor olabilir veya şifre yeterince güçlü değildir.");
      return;
    }

    const profile = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: String(form.get("phone") || ""), kvkkConsent: form.get("kvkkConsent") === "on" }),
    });
    if (!profile.ok) {
      setSubmitting(false);
      setError("Hesap açıldı ancak profil tamamlanamadı. Lütfen giriş yapıp tekrar deneyin.");
      return;
    }

    router.push("/panel/hasta");
    router.refresh();
  }

  return (
    <form method="post" onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">Ad soyad<input name="name" autoComplete="name" required minLength={2} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">E-posta<input name="email" type="email" autoComplete="email" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Telefon<input name="phone" inputMode="tel" autoComplete="tel" required minLength={7} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Şifre<input name="password" type="password" autoComplete="new-password" required minLength={10} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Şifre tekrar<input name="passwordConfirm" type="password" autoComplete="new-password" required minLength={10} className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
      </div>
      <p className="text-xs text-slate-500">En az 10 karakterli, tahmin edilmesi zor bir şifre kullanın.</p>
      <label className="flex items-start gap-2 text-sm text-slate-700"><input name="kvkkConsent" data-testid="patient-kvkk" type="checkbox" required className="mt-1" />KVKK aydınlatma metnini okudum ve hesap için gerekli verilerimin işlenmesini kabul ediyorum.</label>
      <button disabled={submitting} className="rounded-md bg-blue-700 px-3 py-2 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">{submitting ? "Hesap oluşturuluyor" : "Hasta hesabı oluştur"}</button>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
