"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    await authClient.requestPasswordReset({
      email: String(form.get("email") || ""),
      redirectTo: "/auth/sifre-yenile",
    });
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950">
        Bu e-posta ile bir hesap varsa şifre yenileme bağlantısı gönderildi. Gelen kutusu ve gereksiz klasörünü kontrol edin.
      </div>
    );
  }

  return (
    <form method="post" onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        E-posta
        <input name="email" type="email" autoComplete="email" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
      </label>
      <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">
        <Mail className="h-4 w-4" /> {submitting ? "Gönderiliyor" : "Yenileme bağlantısı gönder"}
      </button>
    </form>
  );
}
