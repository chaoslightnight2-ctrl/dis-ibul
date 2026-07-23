import Link from "next/link";
import { CalendarDays, ChevronRight, MapPin, MessageCircle, Phone, ShieldCheck, Star } from "lucide-react";
import { CompareButton } from "@/components/clinic/compare-button";
import { GoogleAttribution } from "@/components/google/google-attribution";
import type { Clinic } from "@/domain/types";
import { formatDate, formatMoney } from "@/lib/format";
import { getContactLinks } from "@/lib/contact-links";

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const firstPrice = clinic.prices[0];
  const hasLiveGoogleData = !clinic.google.isDemoData && clinic.google.rating !== null;
  const selectedTreatment = firstPrice?.treatmentName ?? clinic.treatments[0] ?? "Genel muayene";
  const priceText = !firstPrice
    ? "Fiyat bilgisi bekleniyor"
    : firstPrice.fixedPrice
      ? formatMoney(firstPrice.fixedPrice)
      : `${formatMoney(firstPrice.minPrice ?? 0)} - ${formatMoney(firstPrice.maxPrice ?? 0)}`;
  const contact = getContactLinks(clinic.phone, clinic.whatsapp);

  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[170px_1fr]">
        <div className="flex min-h-36 items-center justify-center rounded-md bg-blue-50 text-sm font-semibold text-blue-900">
          {clinic.name.slice(0, 2).toLocaleUpperCase("tr-TR")}
        </div>
        <div className="grid gap-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-blue-950">{clinic.name}</h2>
                {clinic.verified ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış</span> : null}
                {clinic.freeInitialExam ? <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">İlk muayene ücretsiz</span> : null}
                {clinic.sponsored ? <span className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white">Sponsorlu</span> : null}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="h-4 w-4" /> {clinic.city}, {clinic.district}{clinic.distanceKm === null ? "" : ` · ${clinic.distanceKm} km`}
              </p>
            </div>
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-left md:text-right">
              {hasLiveGoogleData ? (
                <p className="flex items-center gap-1 font-semibold text-blue-950 md:justify-end">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {clinic.google.rating?.toFixed(1)} Google
                </p>
              ) : (
                <p className="text-sm text-slate-500">Google puanı alınamıyor</p>
              )}
              {hasLiveGoogleData ? <p className="text-xs text-slate-500">{clinic.google.reviewCount} değerlendirme</p> : null}
              {hasLiveGoogleData ? <GoogleAttribution className="mt-1 inline-block" /> : null}
            </div>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Başlangıç fiyatı</p>
              <p className="mt-1 font-semibold text-slate-950">{priceText}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">İşlem</p>
              <p className="mt-1 font-semibold text-slate-950">{selectedTreatment}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">İlk muayene</p>
              <p className="mt-1 font-semibold text-slate-950">{clinic.freeInitialExam ? "Ücretsiz" : clinic.firstExamFee === null ? "Belirtilmedi" : formatMoney(clinic.firstExamFee)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">En yakın uygunluk</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-slate-950"><CalendarDays className="h-4 w-4" /> {clinic.nextAvailableAt ? formatDate(clinic.nextAvailableAt) : "Klinikten bilgi alın"}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs font-semibold uppercase text-emerald-800">Yapılan tedaviler · Klinik beyanı</p>
              {clinic.treatments.length ? <div className="mt-2 flex flex-wrap gap-1.5">{clinic.treatments.map((treatment) => <span key={treatment} className="rounded bg-white px-2 py-1 text-xs text-emerald-900">{treatment}</span>)}</div> : <p className="mt-2 text-xs text-emerald-900">Henüz tedavi beyan edilmedi.</p>}
            </div>
            <div className="rounded-md border border-red-100 bg-red-50 p-3">
              <p className="text-xs font-semibold uppercase text-red-800">Yapılmayan tedaviler · Klinik beyanı</p>
              {clinic.unavailableTreatments.length ? <div className="mt-2 flex flex-wrap gap-1.5">{clinic.unavailableTreatments.map((treatment) => <span key={treatment} className="rounded bg-white px-2 py-1 text-xs text-red-900">{treatment}</span>)}</div> : <p className="mt-2 text-xs text-red-900">Yapılmayan tedavi bilgisi belirtilmedi.</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {clinic.patientPerks.slice(0, 3).map((perk) => (
              <span key={perk} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1">
                <ShieldCheck className="h-3 w-3 text-emerald-700" /> {perk}
              </span>
            ))}
          </div>

          {contact.callHref ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <span className="mr-1 text-xs text-slate-500">Klinik tarafından paylaşılan telefon: {clinic.phone}</span>
              <a href={contact.callHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800"><Phone className="h-4 w-4" /> Ara</a>
              <a href={contact.messageHref ?? undefined} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> Mesaj at</a>
              {contact.whatsappHref ? <a href={contact.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800">WhatsApp</a> : null}
            </div>
          ) : <p className="text-xs text-slate-500">Telefon numarası klinik tarafından henüz paylaşılmadı.</p>}

          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
            <Link href={`/randevu-talebi?clinic=${clinic.slug}&treatment=${encodeURIComponent(selectedTreatment)}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              Randevu iste <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href={`/fiyat-teklifi?clinics=${clinic.slug}&treatment=${encodeURIComponent(selectedTreatment)}&city=${encodeURIComponent(clinic.city)}`} className="inline-flex items-center justify-center rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800">
              Fiyat teklifi al
            </Link>
            <Link href={`/klinikler/${clinic.slug}`} className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              Detay
            </Link>
            <CompareButton clinicSlug={clinic.slug} />
          </div>
        </div>
      </div>
    </article>
  );
}
