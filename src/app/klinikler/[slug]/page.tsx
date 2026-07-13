import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, MapPin, Star } from "lucide-react";
import { GoogleReviewLink } from "@/components/google/google-review-link";
import { MedicalNotice } from "@/components/ui/notice";
import { findClinicBySlug } from "@/data/clinics";
import { formatDate, formatMoney } from "@/lib/format";

type ClinicPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ClinicPage({ params }: ClinicPageProps) {
  const { slug } = await params;
  const clinic = findClinicBySlug(slug);
  if (!clinic) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-56 items-end bg-gradient-to-r from-blue-100 via-white to-sky-100 p-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {clinic.verified ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış klinik</span> : null}
              {clinic.freeInitialExam ? <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">İlk muayene ücretsiz</span> : null}
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Google eşleşmesi: {clinic.google.syncStatus}</span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-950">{clinic.name}</h1>
            <p className="mt-2 flex items-center gap-1 text-slate-700"><MapPin className="h-4 w-4" /> {clinic.address}</p>
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <MedicalNotice />
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">İlk muayene</p>
                <p className="mt-1 text-2xl font-semibold text-blue-950">{clinic.freeInitialExam ? "Ücretsiz" : formatMoney(clinic.firstExamFee)}</p>
                <p className="mt-2 text-xs text-blue-800">{clinic.initialExamIncludes.join(" · ")}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">Teklif dönüş süresi</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-950">{clinic.responseTimeHours} saat</p>
                <p className="mt-2 text-xs text-emerald-800">Klinik panelinde SLA olarak takip edilir.</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <p className="text-sm text-slate-500">Ödeme seçenekleri</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{clinic.financingOptions.join(", ")}</p>
              </div>
            </section>
            <section>
              <h2 className="text-xl font-semibold">Tedaviler ve fiyatlar</h2>
              <div className="mt-3 grid gap-3">
                {clinic.prices.map((price) => (
                  <div key={price.treatmentSlug} className="rounded-md border border-slate-200 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">{price.treatmentName}</p>
                      <p className="font-semibold text-blue-800">
                        {price.fixedPrice ? formatMoney(price.fixedPrice, price.currency) : `${formatMoney(price.minPrice ?? 0, price.currency)} - ${formatMoney(price.maxPrice ?? 0, price.currency)}`}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{price.unit}. Fiyatı klinik girmiştir. Son güncelleme: {formatDate(price.updatedAt)}</p>
                    <p className="mt-1 text-sm text-slate-600">Ek ücret koşulları: {price.extraFeeConditions}</p>
                  </div>
                ))}
              </div>
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              {[
                ["Hasta avantajları", clinic.patientPerks],
                ["Teknoloji", clinic.technologyHighlights],
                ["Sterilizasyon ve hijyen", clinic.hygieneHighlights],
                ["Klinik yönetim özellikleri", clinic.clinicManagerFeatures],
              ].map(([title, items]) => (
                <div key={title as string} className="rounded-lg border border-slate-200 bg-white p-4">
                  <h2 className="font-semibold text-slate-950">{title as string}</h2>
                  <ul className="mt-3 grid gap-2 text-sm text-slate-700">
                    {(items as string[]).map((item) => (
                      <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
            <section>
              <h2 className="text-xl font-semibold">Klinik doktorları</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {clinic.doctors.map((doctor) => (
                  <Link key={doctor.slug} href={`/doktorlar/${doctor.slug}`} className="rounded-md border border-slate-200 p-4 hover:border-blue-300">
                    <p className="font-semibold">{doctor.fullName}</p>
                    <p className="text-sm text-slate-600">{doctor.title} · {doctor.experienceYears} yıl deneyim</p>
                    <p className="mt-2 text-sm text-slate-600">Çalıştığı kliniğin Google puanı: {clinic.google.rating ?? "alınamıyor"}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">Google puanı</h2>
              {clinic.google.rating ? (
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {clinic.google.rating.toFixed(1)} / 5</p>
              ) : <p className="mt-2 text-sm text-slate-600">Google puanı şu anda alınamıyor.</p>}
              <p className="text-sm text-slate-600">{clinic.google.reviewCount ?? 0} Google değerlendirmesi</p>
              <p className="mt-2 text-xs text-slate-500">Son senkronizasyon: {clinic.google.lastSyncedAt ? formatDate(clinic.google.lastSyncedAt) : "Yok"}</p>
              <div className="mt-4 grid gap-2">
                <a href={clinic.google.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">
                  {"Google'da tüm yorumları gör"} <ExternalLink className="h-4 w-4" />
                </a>
                <GoogleReviewLink href={clinic.google.writeReviewUrl} />
              </div>
              {clinic.google.isDemoData ? <p className="mt-3 text-xs text-slate-500">Demo ortamı: Google değerleri örnek veridir.</p> : null}
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">Randevu veya teklif</h2>
              <p className="mt-2 text-sm text-slate-600">İlk uygun randevu: {formatDate(clinic.nextAvailableAt)}</p>
              <div className="mt-4 grid gap-2">
                <Link href={`/randevu-talebi?clinic=${clinic.slug}&treatment=${encodeURIComponent(clinic.prices[0]?.treatmentName ?? clinic.treatments[0])}`} className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">Randevu iste</Link>
                <Link href={`/fiyat-teklifi?clinics=${clinic.slug}&treatment=${encodeURIComponent(clinic.prices[0]?.treatmentName ?? clinic.treatments[0])}&city=${encodeURIComponent(clinic.city)}`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium">Fiyat teklifi al</Link>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
