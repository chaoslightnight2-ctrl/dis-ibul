"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const appointmentOptions = [
  ["VIEWED_BY_CLINIC", "Talebi gördüm"],
  ["INFO_REQUESTED", "Ek bilgi istendi"],
  ["APPROVED", "Randevuyu onayla"],
  ["ALTERNATIVE_TIME_PROPOSED", "Alternatif saat öner"],
  ["CANCELLED", "İptal et"],
  ["COMPLETED", "Tamamlandı"],
] as const;

export function AppointmentStatusAction({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus === "PENDING" ? "VIEWED_BY_CLINIC" : currentStatus);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/clinic/appointments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (!response.ok) return setMessage("Durum güncellenemedi.");
    setMessage("Kaydedildi");
    router.refresh();
  }

  return <div className="flex flex-wrap items-center gap-2"><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-md border border-blue-200 px-2 py-2 text-sm text-slate-800">{appointmentOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={save} disabled={saving} className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400">{saving ? "Kaydediliyor" : "Kaydet"}</button>{message ? <span className="text-xs text-slate-500">{message}</span> : null}</div>;
}

export function QuoteResponseForm({ id, hasResponse }: { id: string; hasResponse: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/clinic/quotes/${id}/response`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        estimatedMinPrice: String(form.get("estimatedMinPrice") || ""),
        estimatedMaxPrice: String(form.get("estimatedMaxPrice") || ""),
        includedItems: String(form.get("includedItems") || ""),
        estimatedSessions: String(form.get("estimatedSessions") || "") || undefined,
        note: String(form.get("note") || ""),
      }),
    });
    setSaving(false);
    if (!response.ok) return setMessage("Teklif kaydedilemedi. Fiyat aralığını ve kapsamı kontrol edin.");
    setMessage("Teklif hastaya iletildi.");
    setOpen(false);
    router.refresh();
  }

  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">{hasResponse ? "Teklifi güncelle" : "Teklif hazırla"}</button>;

  return <form method="post" onSubmit={submit} className="mt-3 grid gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-3"><div className="grid gap-2 sm:grid-cols-3"><input name="estimatedMinPrice" type="number" min="0" placeholder="Min. fiyat" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><input name="estimatedMaxPrice" type="number" min="0" placeholder="Maks. fiyat" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><input name="estimatedSessions" type="number" min="1" placeholder="Seans" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /></div><input name="includedItems" required minLength={3} placeholder="Fiyata dahil olanlar" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><textarea name="note" rows={2} maxLength={1000} placeholder="Hastaya not" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><div className="flex flex-wrap gap-2"><button disabled={saving} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:bg-slate-400">{saving ? "Kaydediliyor" : "Teklifi gönder"}</button><button type="button" onClick={() => setOpen(false)} className="rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-900">Vazgeç</button></div>{message ? <p className="text-xs text-red-700">{message}</p> : null}</form>;
}
