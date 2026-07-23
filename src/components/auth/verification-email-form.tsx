"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function VerificationEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    await authClient.sendVerificationEmail({
      email: String(form.get("email") || ""),
      callbackURL: "/auth/eposta-dogrulandi",
    });
    setSubmitting(false);
    setSent(true);
  }

  return (
    <form method="post" onSubmit={submit} className="grid gap-4">
      <label className="grid gap-1 text-sm font-medium text-slate-700">E-posta<input name="email" type="email" defaultValue={initialEmail} autoComplete="email" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" /></label>
      <button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400"><Send className="h-4 w-4" /> {submitting ? "Gönderiliyor" : "Doğrulama e-postası gönder"}</button>
      {sent ? <p role="status" className="text-sm leading-6 text-emerald-800">Bu e-posta doğrulanmayı bekleyen bir hesaba aitse yeni bağlantı gönderildi.</p> : null}
    </form>
  );
}
