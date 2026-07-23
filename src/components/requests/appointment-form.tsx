"use client";

import { useState } from "react";

type AppointmentFormProps = { clinicSlug: string; treatmentName: string };

export function AppointmentForm({ clinicSlug, treatmentName }: AppointmentFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [slots, setSlots] = useState<Array<{ start: string; label: string }>>([]);
  const [selectedStart, setSelectedStart] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  async function loadSlots(date: string) {
    setSelectedStart("");
    setSlots([]);
    setMessage("");
    if (!date) return;
    setLoadingSlots(true);
    const response = await fetch(`/api/availability?clinicSlug=${encodeURIComponent(clinicSlug)}&date=${encodeURIComponent(date)}`, { cache: "no-store" });
    const data = await response.json().catch(() => null) as { slots?: Array<{ start: string; label: string }>; reason?: string } | null;
    setLoadingSlots(false);
    if (!response.ok) return setMessage("Müsait saatler alınamadı.");
    setSlots(data?.slots ?? []);
    if (!data?.slots?.length) setMessage(data?.reason === "CLINIC_CLOSED" || data?.reason === "CLOSED_DAY" ? "Klinik bu tarihte kapalı." : "Bu tarih için boş saat bulunmuyor.");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    if (!selectedStart) {
      setStatus("error");
      setMessage("Önce uygun bir gün ve saat seçin.");
      return;
    }
    const response = await fetch("/api/appointment-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clinicSlug,
        treatmentName: String(form.get("treatmentName") || treatmentName),
        preferredDate: selectedStart,
        fullName: String(form.get("fullName") || ""),
        phone: String(form.get("phone") || ""),
        note: String(form.get("note") || ""),
        kvkkConsent: form.get("kvkkConsent") === "on",
      }),
    });

    if (response.ok) {
      setStatus("success");
      setMessage("Randevu talebiniz kaydedildi ve kliniğin talep ekranına iletildi.");
      formElement.reset();
      setSlots([]);
      setSelectedStart("");
      return;
    }

    setStatus("error");
    setMessage(response.status === 409 ? "Seçtiğiniz saat az önce doldu. Başka bir saat seçin." : response.status === 429 ? "Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin." : "Talep gönderilemedi. Zorunlu alanları ve KVKK onayını kontrol edin.");
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <label className="grid gap-1 text-sm font-medium text-slate-700">Tedavi<input name="treatmentName" defaultValue={treatmentName} required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Ad soyad<input name="fullName" required autoComplete="name" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Telefon<input name="phone" required inputMode="tel" autoComplete="tel" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Randevu günü<input name="appointmentDate" type="date" required min={new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())} onChange={(event) => loadSlots(event.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <fieldset className="grid gap-2"><legend className="text-sm font-medium text-slate-700">Müsait saatler</legend>{loadingSlots ? <p className="text-sm text-slate-500">Saatler yükleniyor…</p> : slots.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">{slots.map((slot) => <button key={slot.start} type="button" onClick={() => setSelectedStart(slot.start)} className={`rounded-md border px-2 py-2 text-sm font-semibold ${selectedStart === slot.start ? "border-blue-700 bg-blue-700 text-white" : "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-500"}`}>{slot.label}</button>)}</div> : <p className="text-sm text-slate-500">Önce bir gün seçin.</p>}</fieldset>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Not<textarea name="note" rows={4} maxLength={1000} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <label className="flex items-start gap-2 text-sm text-slate-700"><input name="kvkkConsent" type="checkbox" required className="mt-1" />KVKK aydınlatma metnini okudum; randevu talebi için iletişim bilgilerimin işlenmesini kabul ediyorum.</label>
      <button disabled={status === "submitting"} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">{status === "submitting" ? "Gönderiliyor" : "Randevu talebi gönder"}</button>
      {message ? <p role="status" className={status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </form>
  );
}
