"use client";

import { useState } from "react";

type AppointmentFormProps = {
  clinicSlug: string;
  treatmentName: string;
};

export function AppointmentForm({ clinicSlug, treatmentName }: AppointmentFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const preferredDate = String(form.get("preferredDate") || "");
    const response = await fetch("/api/appointment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicSlug,
        treatmentName: String(form.get("treatmentName") || treatmentName),
        preferredDate: preferredDate || undefined,
        fullName: String(form.get("fullName") || ""),
        phone: String(form.get("phone") || ""),
        note: String(form.get("note") || ""),
        kvkkConsent: form.get("kvkkConsent") === "on",
      }),
    });

    if (response.ok) {
      setStatus("success");
      setMessage("Randevu talebiniz alındı. Klinik yanıtı bu MVP akışında panel kuyruğuna düşecek şekilde tasarlandı.");
      formElement.reset();
      return;
    }

    setStatus("error");
    setMessage("Talep gönderilemedi. Lütfen zorunlu alanları ve KVKK onayını kontrol edin.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Tedavi
        <input name="treatmentName" defaultValue={treatmentName} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Ad soyad
        <input name="fullName" required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Telefon
        <input name="phone" required inputMode="tel" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Tercih edilen tarih
        <input name="preferredDate" type="datetime-local" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Not
        <textarea name="note" rows={4} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" />
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="kvkkConsent" type="checkbox" required className="mt-1" />
        KVKK aydınlatma metnini okudum; randevu talebi için iletişim bilgilerimin işlenmesini kabul ediyorum.
      </label>
      <button disabled={status === "submitting"} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">
        {status === "submitting" ? "Gönderiliyor" : "Randevu talebi gönder"}
      </button>
      {message ? <p className={status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </form>
  );
}
