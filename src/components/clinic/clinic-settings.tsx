"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Save } from "lucide-react";

type ClinicProfileValues = {
  name: string;
  description: string;
  foundingYear: number | null;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  freeInitialExam: boolean;
  firstExamFee: number | null;
  initialExamIncludes: string[];
  languages: string[];
  paymentOptions: string[];
  emergencyService: boolean;
  wheelchairAccess: boolean;
  parking: boolean;
  onlineConsultation: boolean;
  childFriendly: boolean;
  sedation: boolean;
};

type TreatmentOption = { slug: string; name: string; pricingUnit: string };
type TreatmentAvailability = "OFFERED" | "NOT_OFFERED" | "UNKNOWN";

function splitList(value: FormDataEntryValue | null) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

export function ClinicProfileForm({ clinic }: { clinic: ClinicProfileValues }) {
  const router = useRouter();
  const [freeExam, setFreeExam] = useState(clinic.freeInitialExam);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const foundingYear = String(form.get("foundingYear") || "");
    const examFee = String(form.get("firstExamFee") || "");
    const response = await fetch("/api/clinic/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        description: form.get("description"),
        foundingYear: foundingYear ? Number(foundingYear) : null,
        city: form.get("city"),
        district: form.get("district"),
        neighborhood: form.get("neighborhood"),
        address: form.get("address"),
        phone: form.get("phone"),
        whatsapp: form.get("whatsapp"),
        email: form.get("email"),
        website: form.get("website"),
        freeInitialExam: freeExam,
        firstExamFee: freeExam ? 0 : examFee ? Number(examFee) : null,
        initialExamIncludes: splitList(form.get("initialExamIncludes")),
        languages: splitList(form.get("languages")),
        paymentOptions: splitList(form.get("paymentOptions")),
        emergencyService: form.get("emergencyService") === "on",
        wheelchairAccess: form.get("wheelchairAccess") === "on",
        parking: form.get("parking") === "on",
        onlineConsultation: form.get("onlineConsultation") === "on",
        childFriendly: form.get("childFriendly") === "on",
        sedation: form.get("sedation") === "on",
      }),
    });
    setStatus(response.ok ? "success" : "error");
    setMessage(response.ok ? "Profil kaydedildi. Yayın için incelemeye gönderin." : "Profil kaydedilemedi. Zorunlu alanları ve web adresini kontrol edin.");
    if (response.ok) router.refresh();
  }

  const amenities = [
    ["emergencyService", "Acil hizmet", clinic.emergencyService],
    ["wheelchairAccess", "Engelli erişimi", clinic.wheelchairAccess],
    ["parking", "Otopark", clinic.parking],
    ["onlineConsultation", "Online ön görüşme", clinic.onlineConsultation],
    ["childFriendly", "Çocuk dostu", clinic.childFriendly],
    ["sedation", "Sedasyon", clinic.sedation],
  ] as const;

  return (
    <form method="post" onSubmit={submit} className="grid min-w-0 gap-4 rounded-lg border border-blue-100 bg-white p-5 shadow-sm [&_fieldset]:min-w-0 [&_input]:min-w-0 [&_input]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
      <div><h2 className="text-lg font-semibold text-blue-950">Klinik profili</h2><p className="mt-1 text-sm text-slate-600">Hastaların göreceği doğrulanabilir temel bilgileri düzenleyin.</p></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Klinik adı<input name="name" required defaultValue={clinic.name} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Kuruluş yılı<input name="foundingYear" type="number" min="1900" max={new Date().getFullYear()} defaultValue={clinic.foundingYear ?? ""} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Klinik açıklaması<textarea name="description" rows={4} maxLength={2500} defaultValue={clinic.description} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Şehir<input name="city" required defaultValue={clinic.city} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">İlçe<input name="district" required defaultValue={clinic.district} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Mahalle<input name="neighborhood" defaultValue={clinic.neighborhood} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      </div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Açık adres<textarea name="address" required minLength={10} rows={2} defaultValue={clinic.address} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Telefon<input name="phone" required defaultValue={clinic.phone} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">WhatsApp<input name="whatsapp" defaultValue={clinic.whatsapp} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">E-posta<input name="email" type="email" defaultValue={clinic.email} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Web sitesi<input name="website" type="url" placeholder="https://" defaultValue={clinic.website} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Diller, virgülle<input name="languages" required defaultValue={clinic.languages.join(", ")} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Ödeme seçenekleri, virgülle<input name="paymentOptions" defaultValue={clinic.paymentOptions.join(", ")} className="rounded-md border border-blue-200 px-3 py-2" /></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Muayene kapsamı, virgülle<input name="initialExamIncludes" defaultValue={clinic.initialExamIncludes.join(", ")} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_200px]">
        <label className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"><input type="checkbox" checked={freeExam} onChange={(event) => setFreeExam(event.target.checked)} />İlk muayene ücretsiz</label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">İlk muayene ücreti<input name="firstExamFee" disabled={freeExam} type="number" min="0" defaultValue={clinic.firstExamFee ?? ""} className="rounded-md border border-blue-200 px-3 py-2 disabled:bg-slate-100" /></label>
      </div>
      <fieldset><legend className="text-sm font-semibold text-slate-700">Olanaklar</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{amenities.map(([name, label, checked]) => <label key={name} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"><input name={name} type="checkbox" defaultChecked={checked} />{label}</label>)}</div></fieldset>
      <button disabled={status === "saving"} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400"><Save className="h-4 w-4" />{status === "saving" ? "Kaydediliyor" : "Profili kaydet"}</button>
      {message ? <p role="status" className={`text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </form>
  );
}

export function TreatmentCapabilityManager({
  treatments,
  capabilities,
}: {
  treatments: TreatmentOption[];
  capabilities: { slug: string; availability: Exclude<TreatmentAvailability, "UNKNOWN"> }[];
}) {
  const initialValues = Object.fromEntries(
    treatments.map((treatment) => [
      treatment.slug,
      capabilities.find((item) => item.slug === treatment.slug)?.availability ?? "UNKNOWN",
    ]),
  ) as Record<string, TreatmentAvailability>;
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const changedTreatments = treatments.filter((treatment) => values[treatment.slug] !== savedValues[treatment.slug]);

  async function saveChanges() {
    if (!changedTreatments.length) return;
    setStatus("saving");
    setMessage("");
    const responses = await Promise.all(changedTreatments.map(async (treatment) => {
      const response = await fetch("/api/clinic/treatments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ treatmentSlug: treatment.slug, availability: values[treatment.slug] }),
      });
      const body = await response.json() as { message?: string };
      return { response, body };
    }));
    const failure = responses.find((item) => !item.response.ok);
    if (failure) {
      setStatus("error");
      setMessage(failure.body.message ?? "Tedavi durumu kaydedilemedi.");
      return;
    }
    setSavedValues({ ...values });
    setStatus("success");
    setMessage("Tedavi durumları kaydedildi.");
  }

  const options: { value: TreatmentAvailability; label: string }[] = [
    { value: "OFFERED", label: "Yapılıyor" },
    { value: "NOT_OFFERED", label: "Yapılmıyor" },
    { value: "UNKNOWN", label: "Belirtilmedi" },
  ];

  return (
    <section className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-blue-950">Tedavi kapsamı</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Hastalara yalnızca kesin olarak uyguladığınız veya uygulamadığınız tedavileri bildirin. Emin olmadığınız kayıtları belirtilmedi bırakın.</p>
        </div>
        <button type="button" onClick={() => void saveChanges()} disabled={status === "saving" || changedTreatments.length === 0} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
          <Save className="h-4 w-4" /> {status === "saving" ? "Kaydediliyor" : `Değişiklikleri kaydet${changedTreatments.length ? ` (${changedTreatments.length})` : ""}`}
        </button>
      </div>
      <div className="mt-4 divide-y divide-slate-100 rounded-md border border-slate-200">
        {treatments.map((treatment) => (
          <div key={treatment.slug} className="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_minmax(330px,420px)] md:items-center">
            <p className="text-sm font-medium text-slate-800">{treatment.name}</p>
            <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1" aria-label={`${treatment.name} durumu`}>
              {options.map((option) => (
                <button key={option.value} type="button" onClick={() => setValues((current) => ({ ...current, [treatment.slug]: option.value }))} className={`min-h-9 rounded px-2 py-1 text-xs font-semibold ${values[treatment.slug] === option.value ? option.value === "OFFERED" ? "bg-emerald-700 text-white shadow-sm" : option.value === "NOT_OFFERED" ? "bg-red-700 text-white shadow-sm" : "bg-white text-slate-700 shadow-sm" : "text-slate-600"}`}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {message ? <p role="status" className={`mt-3 text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </section>
  );
}

export function TreatmentPriceForm({ treatments }: { treatments: TreatmentOption[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"fixed" | "range">("range");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const value = (name: string) => String(form.get(name) || "");
    const response = await fetch("/api/clinic/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treatmentSlug: value("treatmentSlug"),
        pricingMode: mode,
        fixedPrice: value("fixedPrice") ? Number(value("fixedPrice")) : null,
        minPrice: value("minPrice") ? Number(value("minPrice")) : null,
        maxPrice: value("maxPrice") ? Number(value("maxPrice")) : null,
        currency: value("currency"),
        priceUnit: value("priceUnit"),
        vatIncluded: form.get("vatIncluded") === "on",
        examIncluded: form.get("examIncluded") === "on",
        imagingIncluded: form.get("imagingIncluded") === "on",
        packageContent: value("packageContent"),
        extraFeeConditions: value("extraFeeConditions"),
      }),
    });
    setStatus(response.ok ? "success" : "error");
    setMessage(response.ok ? "Fiyat moderasyon kuyruğuna gönderildi." : "Fiyat kaydedilemedi. Fiyat türünü ve tutarları kontrol edin.");
    if (response.ok) {
      formElement.reset();
      router.refresh();
    }
  }

  if (!treatments.length) return <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Tedavi sözlüğü henüz hazırlanmadı.</p>;

  return (
    <form method="post" onSubmit={submit} className="grid min-w-0 gap-4 rounded-lg border border-blue-100 bg-white p-5 shadow-sm [&_input]:min-w-0 [&_input]:max-w-full [&_select]:min-w-0 [&_select]:max-w-full [&_textarea]:min-w-0 [&_textarea]:max-w-full">
      <div><h2 className="text-lg font-semibold text-blue-950">Tedavi fiyatı ekle veya güncelle</h2><p className="mt-1 text-sm text-slate-600">Yeni kayıt moderasyon onayından sonra yayına girer.</p></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium text-slate-700">Tedavi<select name="treatmentSlug" required className="rounded-md border border-blue-200 px-3 py-2">{treatments.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Para birimi<select name="currency" defaultValue="TRY" className="rounded-md border border-blue-200 px-3 py-2"><option>TRY</option><option>EUR</option><option>USD</option></select></label>
        <label className="grid gap-1 text-sm font-medium text-slate-700">Fiyat birimi<input name="priceUnit" required defaultValue={treatments[0].pricingUnit} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-md bg-blue-50 p-1"><button type="button" onClick={() => setMode("range")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "range" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`}>Fiyat aralığı</button><button type="button" onClick={() => setMode("fixed")} className={`rounded-md px-3 py-2 text-sm font-semibold ${mode === "fixed" ? "bg-white text-blue-800 shadow-sm" : "text-slate-600"}`}>Sabit fiyat</button></div>
      {mode === "range" ? <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium text-slate-700">Minimum fiyat<input name="minPrice" required type="number" min="1" className="rounded-md border border-blue-200 px-3 py-2" /></label><label className="grid gap-1 text-sm font-medium text-slate-700">Maksimum fiyat<input name="maxPrice" required type="number" min="1" className="rounded-md border border-blue-200 px-3 py-2" /></label></div> : <label className="grid gap-1 text-sm font-medium text-slate-700">Sabit fiyat<input name="fixedPrice" required type="number" min="1" className="rounded-md border border-blue-200 px-3 py-2" /></label>}
      <div className="grid gap-2 sm:grid-cols-3"><label className="flex items-center gap-2 text-sm text-slate-700"><input name="vatIncluded" type="checkbox" defaultChecked />KDV dahil</label><label className="flex items-center gap-2 text-sm text-slate-700"><input name="examIncluded" type="checkbox" />Muayene dahil</label><label className="flex items-center gap-2 text-sm text-slate-700"><input name="imagingIncluded" type="checkbox" />Görüntüleme dahil</label></div>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Fiyata dahil olanlar<textarea name="packageContent" rows={2} maxLength={1000} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      <label className="grid gap-1 text-sm font-medium text-slate-700">Ek ücret koşulları<textarea name="extraFeeConditions" rows={2} maxLength={1000} className="rounded-md border border-blue-200 px-3 py-2" /></label>
      <button disabled={status === "saving"} className="rounded-md bg-blue-700 px-4 py-2 font-semibold text-white disabled:bg-slate-400">{status === "saving" ? "Kaydediliyor" : "Fiyatı moderasyona gönder"}</button>
      {message ? <p role="status" className={`text-sm ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>{message}</p> : null}
    </form>
  );
}

export function SubmitClinicReviewButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/clinic/submit-review", { method: "POST" });
    const data = await response.json() as { message?: string };
    setBusy(false);
    setMessage(response.ok ? "Profil moderasyon kuyruğuna gönderildi." : data.message || "Profil gönderilemedi.");
    if (response.ok) router.refresh();
  }

  return <div className="grid gap-2"><button type="button" onClick={() => void submit()} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send className="h-4 w-4" />{busy ? "Gönderiliyor" : "İncelemeye gönder"}</button>{message ? <p role="status" className="text-xs text-slate-600">{message}</p> : null}</div>;
}
