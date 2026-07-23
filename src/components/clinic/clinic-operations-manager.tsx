"use client";

import { useRouter } from "next/navigation";
import { Archive, CalendarOff, Clock3, Pencil, Plus, Tags, X } from "lucide-react";
import { useState } from "react";

type Hour = { dayOfWeek: number; opensAt: string; closesAt: string; isClosed: boolean };
type ClosedDay = { id: string; date: string; reason: string | null };
type Campaign = { id: string; title: string; description: string | null; startsAt: string | null; endsAt: string | null; isActive: boolean };
type TreatmentPackage = { id: string; treatmentSlug: string | null; name: string; description: string | null; price: number | null; currency: string; startsAt: string | null; endsAt: string | null; isActive: boolean };

const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

async function request(url: string, method: string, body?: unknown) {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) throw new Error(data?.error === "CLOSED_DAY_EXISTS" ? "Bu tarih zaten kapalı gün olarak kayıtlı." : "İşlem tamamlanamadı. Alanları kontrol edin.");
}

function localInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text ? new Date(text).toISOString() : "";
}

export function ClinicOperationsManager({
  initialHours,
  appointmentDurationMinutes,
  bookingLeadHours,
  bookingWindowDays,
  closedDays,
  campaigns,
  packages,
  treatments,
  canManage,
}: {
  initialHours: Hour[];
  appointmentDurationMinutes: number;
  bookingLeadHours: number;
  bookingWindowDays: number;
  closedDays: ClosedDay[];
  campaigns: Campaign[];
  packages: TreatmentPackage[];
  treatments: Array<{ slug: string; name: string }>;
  canManage: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"schedule" | "offers">("schedule");
  const [hours, setHours] = useState(initialHours);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingPackage, setEditingPackage] = useState<TreatmentPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function run(operation: () => Promise<unknown>, success: string) {
    setSaving(true);
    setMessage("");
    try { await operation(); setMessage(success); router.refresh(); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı."); return false; }
    finally { setSaving(false); }
  }

  async function saveHours(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(() => request("/api/clinic/working-hours", "PUT", {
      appointmentDurationMinutes: Number(form.get("duration")), bookingLeadHours: Number(form.get("lead")), bookingWindowDays: Number(form.get("window")), hours,
    }), "Çalışma saatleri ve randevu kuralları güncellendi.");
  }

  async function addClosedDay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const ok = await run(() => request("/api/clinic/closed-days", "POST", { date: String(form.get("date")), reason: String(form.get("reason") ?? "") }), "Kapalı gün eklendi.");
    if (ok) element.reset();
  }

  async function saveCampaign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const body = { title: String(form.get("title")), description: String(form.get("description") ?? ""), startsAt: toIso(form.get("startsAt")), endsAt: toIso(form.get("endsAt")), isActive: true };
    const ok = await run(() => request(editingCampaign?.id ? `/api/clinic/campaigns/${editingCampaign.id}` : "/api/clinic/campaigns", editingCampaign?.id ? "PATCH" : "POST", body), editingCampaign?.id ? "Kampanya güncellendi." : "Kampanya oluşturuldu.");
    if (ok) { setEditingCampaign(null); element.reset(); }
  }

  async function savePackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const body = { treatmentSlug: String(form.get("treatmentSlug") ?? "") || undefined, name: String(form.get("name")), description: String(form.get("description") ?? ""), price: form.get("price") ? Number(form.get("price")) : null, currency: String(form.get("currency") ?? "TRY"), startsAt: toIso(form.get("startsAt")), endsAt: toIso(form.get("endsAt")), isActive: true };
    const ok = await run(() => request(editingPackage?.id ? `/api/clinic/packages/${editingPackage.id}` : "/api/clinic/packages", editingPackage?.id ? "PATCH" : "POST", body), editingPackage?.id ? "Paket güncellendi." : "Paket oluşturuldu.");
    if (ok) { setEditingPackage(null); element.reset(); }
  }

  async function archive(url: string, prompt: string, success: string) {
    if (!window.confirm(prompt)) return;
    await run(() => request(url, "DELETE"), success);
  }

  return <div><div className="flex gap-1 border-b border-blue-100" role="tablist"><button type="button" role="tab" aria-selected={tab === "schedule"} onClick={() => setTab("schedule")} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === "schedule" ? "border-blue-700 text-blue-800" : "border-transparent text-slate-500"}`}><Clock3 className="h-4 w-4" /> Takvim ve müsaitlik</button><button type="button" role="tab" aria-selected={tab === "offers"} onClick={() => setTab("offers")} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${tab === "offers" ? "border-blue-700 text-blue-800" : "border-transparent text-slate-500"}`}><Tags className="h-4 w-4" /> Kampanya ve paketler</button></div>{message ? <p role="status" className={`mt-4 rounded-md px-4 py-3 text-sm ${message.includes("tamamlanamadı") || message.includes("zaten") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{message}</p> : null}

    {tab === "schedule" ? <section className="py-6"><div><h2 className="text-xl font-semibold text-blue-950">Çalışma saatleri</h2><p className="mt-1 text-sm text-slate-600">Hastalara yalnızca açık, boş ve rezervasyon penceresine uygun saatler gösterilir.</p></div><form method="post" onSubmit={saveHours} className="mt-5"><div className="overflow-x-auto rounded-lg border border-blue-100 bg-white"><table className="min-w-full text-left text-sm"><thead className="border-b border-blue-100 bg-blue-50/60 text-xs text-slate-500"><tr><th className="px-4 py-3">Gün</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Açılış</th><th className="px-4 py-3">Kapanış</th></tr></thead><tbody className="divide-y divide-slate-100">{hours.map((hour, index) => <tr key={hour.dayOfWeek}><td className="px-4 py-3 font-medium text-slate-950">{days[hour.dayOfWeek]}</td><td className="px-4 py-3"><label className="flex items-center gap-2"><input type="checkbox" checked={!hour.isClosed} disabled={!canManage} onChange={(event) => setHours((current) => current.map((value, currentIndex) => currentIndex === index ? { ...value, isClosed: !event.target.checked } : value))} /> Açık</label></td><td className="px-4 py-3"><input type="time" value={hour.opensAt} disabled={!canManage || hour.isClosed} onChange={(event) => setHours((current) => current.map((value, currentIndex) => currentIndex === index ? { ...value, opensAt: event.target.value } : value))} className="rounded-md border border-blue-200 px-2 py-1.5 disabled:bg-slate-50" /></td><td className="px-4 py-3"><input type="time" value={hour.closesAt} disabled={!canManage || hour.isClosed} onChange={(event) => setHours((current) => current.map((value, currentIndex) => currentIndex === index ? { ...value, closesAt: event.target.value } : value))} className="rounded-md border border-blue-200 px-2 py-1.5 disabled:bg-slate-50" /></td></tr>)}</tbody></table></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-sm font-medium text-slate-700">Randevu süresi (dk.)<input name="duration" type="number" min="10" max="180" step="5" defaultValue={appointmentDurationMinutes} disabled={!canManage} className="rounded-md border border-blue-200 px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium text-slate-700">En erken randevu (saat)<input name="lead" type="number" min="0" max="168" defaultValue={bookingLeadHours} disabled={!canManage} className="rounded-md border border-blue-200 px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium text-slate-700">İleri rezervasyon (gün)<input name="window" type="number" min="1" max="365" defaultValue={bookingWindowDays} disabled={!canManage} className="rounded-md border border-blue-200 px-3 py-2" /></label></div>{canManage ? <button disabled={saving} className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400">Saatleri kaydet</button> : null}</form>
      <div className="mt-10"><div className="flex items-center gap-2"><CalendarOff className="h-5 w-5 text-blue-700" /><h2 className="text-xl font-semibold text-blue-950">Kapalı günler</h2></div>{canManage ? <form method="post" onSubmit={addClosedDay} className="mt-4 grid gap-3 border-y border-blue-100 bg-blue-50/40 py-4 sm:grid-cols-[180px_1fr_auto]"><input name="date" type="date" required min={new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())} className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><input name="reason" maxLength={250} placeholder="Neden (isteğe bağlı)" className="rounded-md border border-blue-200 px-3 py-2 text-sm" /><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Ekle</button></form> : null}<div className="mt-4 grid gap-2">{closedDays.map((day) => <div key={day.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm"><div><p className="font-medium text-slate-950">{new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${day.date}T00:00:00Z`))}</p><p className="text-xs text-slate-500">{day.reason || "Klinik kapalı"}</p></div>{canManage ? <button type="button" onClick={() => archive(`/api/clinic/closed-days/${day.id}`, "Kapalı gün kaydı silinsin mi?", "Kapalı gün kaldırıldı.")} aria-label="Kapalı günü sil" title="Sil" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><X className="h-4 w-4" /></button> : null}</div>)}{!closedDays.length ? <p className="rounded-md border border-dashed border-blue-200 p-5 text-center text-sm text-slate-500">Planlanmış kapalı gün yok.</p> : null}</div></div></section> : null}

    {tab === "offers" ? <section className="grid gap-10 py-6"><div><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-blue-950">Kampanyalar</h2><p className="mt-1 text-sm text-slate-600">Tarih aralığı ve koşulları açıkça belirtin.</p></div>{canManage && !editingCampaign ? <button type="button" onClick={() => setEditingCampaign({ id: "", title: "", description: "", startsAt: null, endsAt: null, isActive: true })} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Kampanya ekle</button> : null}</div>{canManage && editingCampaign ? <form key={editingCampaign.id || "new"} onSubmit={saveCampaign} className="mt-4 grid gap-3 border-y border-blue-100 bg-blue-50/40 py-4 sm:grid-cols-2"><input name="title" required minLength={3} defaultValue={editingCampaign.title} placeholder="Kampanya başlığı" className="rounded-md border border-blue-200 px-3 py-2 text-sm sm:col-span-2" /><textarea name="description" rows={2} defaultValue={editingCampaign.description ?? ""} placeholder="Koşullar ve kapsam" className="rounded-md border border-blue-200 px-3 py-2 text-sm sm:col-span-2" /><label className="grid gap-1 text-xs text-slate-600">Başlangıç<input name="startsAt" type="datetime-local" defaultValue={localInput(editingCampaign.startsAt)} className="rounded-md border border-blue-200 px-3 py-2 text-sm" /></label><label className="grid gap-1 text-xs text-slate-600">Bitiş<input name="endsAt" type="datetime-local" defaultValue={localInput(editingCampaign.endsAt)} className="rounded-md border border-blue-200 px-3 py-2 text-sm" /></label><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Kaydet</button><button type="button" onClick={() => setEditingCampaign(null)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Vazgeç</button></div></form> : null}<div className="mt-4 grid gap-3 sm:grid-cols-2">{campaigns.map((campaign) => <article key={campaign.id} className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{campaign.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{campaign.description || "Açıklama eklenmedi."}</p><p className="mt-2 text-xs text-slate-500">{campaign.startsAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(campaign.startsAt)) : "Hemen"} - {campaign.endsAt ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(campaign.endsAt)) : "Süresiz"}</p></div>{canManage ? <div className="flex gap-1"><button type="button" onClick={() => setEditingCampaign(campaign)} title="Düzenle" aria-label="Kampanyayı düzenle" className="grid h-9 w-9 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => archive(`/api/clinic/campaigns/${campaign.id}`, "Kampanya arşivlensin mi?", "Kampanya arşivlendi.")} title="Arşivle" aria-label="Kampanyayı arşivle" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><Archive className="h-4 w-4" /></button></div> : null}</div></article>)}{!campaigns.length && !editingCampaign ? <p className="rounded-md border border-dashed border-blue-200 p-5 text-center text-sm text-slate-500 sm:col-span-2">Aktif kampanya yok.</p> : null}</div></div>
      <div><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-blue-950">Tedavi paketleri</h2><p className="mt-1 text-sm text-slate-600">Paket fiyatı muayene sonrası değişebilecekse açıklamada belirtin.</p></div>{canManage && !editingPackage ? <button type="button" onClick={() => setEditingPackage({ id: "", treatmentSlug: null, name: "", description: "", price: null, currency: "TRY", startsAt: null, endsAt: null, isActive: true })} className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Paket ekle</button> : null}</div>{canManage && editingPackage ? <form key={editingPackage.id || "new"} onSubmit={savePackage} className="mt-4 grid gap-3 border-y border-emerald-100 bg-emerald-50/40 py-4 sm:grid-cols-2"><input name="name" required minLength={3} defaultValue={editingPackage.name} placeholder="Paket adı" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><select name="treatmentSlug" defaultValue={editingPackage.treatmentSlug ?? ""} className="rounded-md border border-emerald-200 px-3 py-2 text-sm"><option value="">Genel paket</option>{treatments.map((treatment) => <option key={treatment.slug} value={treatment.slug}>{treatment.name}</option>)}</select><div className="grid grid-cols-[1fr_100px] gap-2"><input name="price" type="number" min="1" step="0.01" defaultValue={editingPackage.price ?? ""} placeholder="Fiyat" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><select name="currency" defaultValue={editingPackage.currency} className="rounded-md border border-emerald-200 px-2 py-2 text-sm"><option>TRY</option><option>EUR</option><option>USD</option></select></div><textarea name="description" rows={2} defaultValue={editingPackage.description ?? ""} placeholder="Paket kapsamı" className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /><label className="grid gap-1 text-xs text-slate-600">Başlangıç<input name="startsAt" type="datetime-local" defaultValue={localInput(editingPackage.startsAt)} className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /></label><label className="grid gap-1 text-xs text-slate-600">Bitiş<input name="endsAt" type="datetime-local" defaultValue={localInput(editingPackage.endsAt)} className="rounded-md border border-emerald-200 px-3 py-2 text-sm" /></label><div className="flex gap-2 sm:col-span-2"><button disabled={saving} className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Kaydet</button><button type="button" onClick={() => setEditingPackage(null)} className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">Vazgeç</button></div></form> : null}<div className="mt-4 grid gap-3 sm:grid-cols-2">{packages.map((item) => <article key={item.id} className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-950">{item.name}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.description || "Paket kapsamı eklenmedi."}</p><p className="mt-2 font-semibold text-emerald-800">{item.price === null ? "Muayene sonrası" : new Intl.NumberFormat("tr-TR", { style: "currency", currency: item.currency }).format(item.price)}</p></div>{canManage ? <div className="flex gap-1"><button type="button" onClick={() => setEditingPackage(item)} title="Düzenle" aria-label="Paketi düzenle" className="grid h-9 w-9 place-items-center rounded-md text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => archive(`/api/clinic/packages/${item.id}`, "Paket arşivlensin mi?", "Paket arşivlendi.")} title="Arşivle" aria-label="Paketi arşivle" className="grid h-9 w-9 place-items-center rounded-md text-red-700 hover:bg-red-50"><Archive className="h-4 w-4" /></button></div> : null}</div></article>)}{!packages.length && !editingPackage ? <p className="rounded-md border border-dashed border-emerald-200 p-5 text-center text-sm text-slate-500 sm:col-span-2">Aktif tedavi paketi yok.</p> : null}</div></div></section> : null}
  </div>;
}
