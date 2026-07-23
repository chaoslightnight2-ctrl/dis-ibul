"use client";

import { FileUp } from "lucide-react";
import { useState } from "react";

type QuoteFormProps = { clinicSlugs: string[]; treatmentName: string; city: string };

export function QuoteForm({ clinicSlugs, treatmentName, city }: QuoteFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const rawBudgetMin = String(form.get("budgetMin") || "");
    const rawBudgetMax = String(form.get("budgetMax") || "");
    const payload = {
      clinicSlugs,
      treatmentName: String(form.get("treatmentName") || treatmentName),
      complaint: String(form.get("complaint") || ""),
      city: String(form.get("city") || city),
      fullName: String(form.get("fullName") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      preferredDate: String(form.get("preferredDate") || "") || undefined,
      budgetMin: rawBudgetMin ? Number(rawBudgetMin) : undefined,
      budgetMax: rawBudgetMax ? Number(rawBudgetMax) : undefined,
      hasPriorExam: form.get("hasPriorExam") === "on",
      hasImaging: form.get("hasImaging") === "on",
      contactPreference: String(form.get("contactPreference") || "phone"),
      kvkkConsent: form.get("kvkkConsent") === "on",
      healthDataConsent: form.get("healthDataConsent") === "on",
    };
    const body = new FormData();
    body.set("payload", JSON.stringify(payload));
    form.getAll("attachments").forEach((entry) => {
      if (entry instanceof File && entry.size > 0) body.append("attachments", entry);
    });
    const response = await fetch("/api/quote-requests", { method: "POST", body });

    if (response.ok) {
      setStatus("success");
      setMessage("Teklif talebiniz kaydedildi. Her klinik yalnızca kendisine iletilen talebi görebilir.");
      formElement.reset();
      return;
    }

    const result = await response.json().catch(() => ({})) as { error?: string };
    setStatus("error");
    if (response.status === 429) setMessage("Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin.");
    else if (["FILE_TOO_LARGE", "FILES_TOTAL_TOO_LARGE", "REQUEST_TOO_LARGE"].includes(result.error ?? "")) setMessage("Dosyalar çok büyük. Her dosya en fazla 8 MB, toplam en fazla 16 MB olabilir.");
    else if (["FILE_TYPE_NOT_ALLOWED", "FILE_SIGNATURE_NOT_ALLOWED", "FILE_TYPE_MISMATCH"].includes(result.error ?? "")) setMessage("Yalnızca gerçek JPG, PNG veya PDF dosyaları yüklenebilir.");
    else if (result.error === "TOO_MANY_FILES") setMessage("En fazla üç dosya ekleyebilirsiniz.");
    else if (result.error === "FILE_REJECTED_BY_SCANNER") setMessage("Dosya güvenlik kontrolünden geçemedi ve kaydedilmedi.");
    else if (response.status === 503 && result.error?.startsWith("FILE_")) setMessage("Güvenli dosya yükleme hizmeti şu anda kullanılamıyor. Dosya eklemeden tekrar deneyebilirsiniz.");
    else setMessage("Teklif gönderilemedi. İletişim, açıklama ve açık rıza alanlarını kontrol edin.");
  }

  return (
    <form method="post" onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Tedavi<input name="treatmentName" defaultValue={treatmentName} required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Şehir<input name="city" defaultValue={city} required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Şikayet veya ihtiyaç açıklaması<textarea name="complaint" required minLength={10} maxLength={1500} rows={5} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Ad soyad<input name="fullName" autoComplete="name" required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Telefon<input name="phone" inputMode="tel" autoComplete="tel" required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">E-posta<input name="email" type="email" autoComplete="email" required className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Minimum bütçe<input name="budgetMin" type="number" min="0" inputMode="numeric" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Maksimum bütçe<input name="budgetMax" type="number" min="0" inputMode="numeric" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Tercih edilen gün<input name="preferredDate" type="date" min={new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date())} className="rounded-md border border-slate-300 px-3 py-2 text-slate-950" /></label>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm text-slate-700"><input name="hasPriorExam" type="checkbox" />Daha önce muayene oldum</label>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input name="hasImaging" type="checkbox" />Görüntüleme sonucum var</label>
      </div>
      <label className="grid gap-2 rounded-md border border-dashed border-blue-200 bg-blue-50/40 p-4 text-sm font-medium text-slate-700">
        <span className="flex items-center gap-2"><FileUp className="h-4 w-4 text-blue-700" />Fotoğraf veya görüntüleme sonucu</span>
        <input name="attachments" type="file" accept="image/jpeg,image/png,application/pdf" multiple className="block w-full text-sm font-normal text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:font-semibold file:text-white" />
        <span className="text-xs font-normal text-slate-500">İsteğe bağlı · JPG, PNG veya PDF · en fazla 3 dosya, dosya başına 8 MB</span>
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">İletişim tercihi<select name="contactPreference" className="rounded-md border border-slate-300 px-3 py-2 text-slate-950"><option value="phone">Telefon</option><option value="email">E-posta</option><option value="whatsapp">WhatsApp</option></select></label>
      <label className="flex items-start gap-2 text-sm text-slate-700"><input name="kvkkConsent" type="checkbox" required className="mt-1" />KVKK aydınlatma metnini okudum ve talep için verilerimin işlenmesini kabul ediyorum.</label>
      <label className="flex items-start gap-2 text-sm text-slate-700"><input name="healthDataConsent" type="checkbox" required className="mt-1" />Sağlık verisi niteliğindeki açıklamamın teklif amacıyla işlenmesine açık rıza veriyorum.</label>
      <button disabled={status === "submitting"} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">{status === "submitting" ? "Gönderiliyor" : "Fiyat teklifi gönder"}</button>
      {message ? <p role="status" className={status === "error" ? "text-sm text-red-700" : "text-sm text-emerald-700"}>{message}</p> : null}
    </form>
  );
}
