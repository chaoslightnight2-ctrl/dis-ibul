"use client";

import { useState } from "react";

type QuoteFormProps = {
  clinicSlugs: string[];
  treatmentName: string;
  city: string;
};

export function QuoteForm({ clinicSlugs, treatmentName, city }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const rawBudgetMin = String(form.get("budgetMin") || "");
    const rawBudgetMax = String(form.get("budgetMax") || "");
    const response = await fetch("/api/quote-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicSlugs,
        treatmentName: String(form.get("treatmentName") || treatmentName),
        complaint: String(form.get("complaint") || ""),
        city: String(form.get("city") || city),
        budgetMin: rawBudgetMin ? Number(rawBudgetMin) : undefined,
        budgetMax: rawBudgetMax ? Number(rawBudgetMax) : undefined,
        contactPreference: String(form.get("contactPreference") || "phone"),
        kvkkConsent: form.get("kvkkConsent") === "on",
        healthDataConsent: form.get("healthDataConsent") === "on",
      }),
    });

    if (response.ok) {
      setStatus("success");
      setMessage("Teklif talebiniz alındı. Her klinik talebi ayrı görecek; diğer kliniklerin yanıtları paylaşılmayacak.");
      formElement.reset();
      return;
    }

    setStatus("error");
    setMessage("Teklif talebi gönderilemedi. Açıklama ve açık rıza alanlarını kontrol edin.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Tedavi
        <input name="treatmentName" defaultValue={treatmentName} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Şehir
        <input name="city" defaultValue={city} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Şikayet veya ihtiyaç açıklaması
        <textarea name="complaint" required minLength={10} rows={5} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Minimum bütçe
          <input name="budgetMin" inputMode="numeric" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Maksimum bütçe
          <input name="budgetMax" inputMode="numeric" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        İletişim tercihi
        <select name="contactPreference" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950">
          <option value="phone">Telefon</option>
          <option value="email">E-posta</option>
          <option value="whatsapp">WhatsApp</option>
        </select>
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="kvkkConsent" type="checkbox" required className="mt-1" />
        KVKK aydınlatma metnini okudum ve talep süreci için verilerimin işlenmesini kabul ediyorum.
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="healthDataConsent" type="checkbox" required className="mt-1" />
        Sağlık verisi niteliğindeki açıklamamın teklif amacıyla işlenmesine açık rıza veriyorum.
      </label>
      <button disabled={status === "submitting"} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">
        {status === "submitting" ? "Gönderiliyor" : "Fiyat teklifi gönder"}
      </button>
      {message ? <p className={status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </form>
  );
}
