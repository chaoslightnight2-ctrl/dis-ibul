"use client";

import { useState } from "react";
import Link from "next/link";

type ApplicationResponse = {
  applicationId: string;
  status: string;
  nextSteps: string[];
};

const specialtyOptions = ["İmplantoloji", "Ortodonti", "Estetik diş hekimliği", "Pedodonti", "Çene cerrahisi"];

export function ClinicApplicationForm() {
  const [freeInitialExam, setFreeInitialExam] = useState(false);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(["İmplantoloji"]);
  const [result, setResult] = useState<ApplicationResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/clinic-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountType: "clinic",
        clinicName: String(form.get("clinicName") || ""),
        ownerName: String(form.get("ownerName") || ""),
        roleTitle: String(form.get("roleTitle") || "clinic_manager"),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || ""),
        city: String(form.get("city") || ""),
        district: String(form.get("district") || ""),
        specialties: selectedSpecialties,
        firstExamFee: freeInitialExam ? 0 : Number(form.get("firstExamFee") || 0),
        freeInitialExam,
        googlePlaceId: String(form.get("googlePlaceId") || ""),
        kvkkConsent: form.get("kvkkConsent") === "on",
        moderationConsent: form.get("moderationConsent") === "on",
      }),
    });

    setSubmitting(false);
    if (!response.ok) {
      setError("Başvuru gönderilemedi. Zorunlu alanları ve onayları kontrol edin.");
      return;
    }

    setResult(await response.json() as ApplicationResponse);
  }

  if (result) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="text-lg font-semibold text-emerald-950">Başvuru alındı</h3>
        <p className="mt-1 text-sm text-emerald-900">Başvuru kodu: {result.applicationId}</p>
        <ul className="mt-4 grid gap-2 text-sm text-emerald-950">
          {result.nextSteps.map((step) => <li key={step}>• {step}</li>)}
        </ul>
        <Link href="/panel/klinik?demo=klinik" className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">
          Klinik paneli demosuna geç
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Klinik veya muayenehane adı
          <input name="clinicName" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" placeholder="Örn. Mavi Gülüş Kliniği" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Yetkili kişi
          <input name="ownerName" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Rol
          <select name="roleTitle" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950">
            <option value="clinic_manager">Klinik yöneticisi</option>
            <option value="dentist">Diş hekimi</option>
            <option value="owner">Klinik sahibi</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          E-posta
          <input name="email" type="email" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Telefon
          <input name="phone" required inputMode="tel" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Şehir
          <input name="city" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          İlçe
          <input name="district" required className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Google Place ID
          <input name="googlePlaceId" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950" placeholder="Opsiyonel" />
        </label>
      </div>

      <fieldset className="rounded-md border border-blue-100 bg-blue-50 p-3">
        <legend className="px-1 text-sm font-semibold text-blue-950">Uzmanlıklar</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {specialtyOptions.map((specialty) => {
            const active = selectedSpecialties.includes(specialty);
            return (
              <button
                key={specialty}
                type="button"
                onClick={() => {
                  setSelectedSpecialties((current) => active ? current.filter((item) => item !== specialty) : [...current, specialty]);
                }}
                className={`rounded-full px-3 py-1 text-sm font-medium ${active ? "bg-blue-700 text-white" : "bg-white text-slate-700"}`}
              >
                {specialty}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-3 rounded-md border border-blue-100 bg-white p-3 sm:grid-cols-[1fr_180px]">
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={freeInitialExam} onChange={(event) => setFreeInitialExam(event.target.checked)} className="mt-1" />
          İlk muayene ücretsiz olsun ve profilde yeşil avantaj etiketi olarak gösterilsin.
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          İlk muayene ücreti
          <input name="firstExamFee" disabled={freeInitialExam} inputMode="numeric" defaultValue="750" className="rounded-md border border-blue-200 px-3 py-2 text-slate-950 disabled:bg-slate-100" />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="kvkkConsent" type="checkbox" required className="mt-1" />
        KVKK aydınlatma metnini okudum ve başvuru süreci için verilerimin işlenmesini kabul ediyorum.
      </label>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input name="moderationConsent" type="checkbox" required className="mt-1" />
        Klinik bilgilerinin moderasyon ve belge kontrolünden sonra yayınlanacağını kabul ediyorum.
      </label>

      <button disabled={submitting} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800 disabled:bg-slate-400">
        {submitting ? "Başvuru gönderiliyor" : "Klinik başvurusu gönder"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
