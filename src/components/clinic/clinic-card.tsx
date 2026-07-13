import Link from "next/link";
import { CalendarDays, ChevronRight, GitCompare, MapPin, ShieldCheck, Star } from "lucide-react";
import type { Clinic } from "@/domain/types";
import { formatDate, formatMoney } from "@/lib/format";

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const firstPrice = clinic.prices[0];
  const priceText = firstPrice?.fixedPrice
    ? formatMoney(firstPrice.fixedPrice)
    : `${formatMoney(firstPrice?.minPrice ?? 0)} - ${formatMoney(firstPrice?.maxPrice ?? 0)}`;

  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[170px_1fr]">
        <div className="flex min-h-36 items-center justify-center rounded-md bg-gradient-to-br from-blue-100 via-white to-sky-100 text-sm font-semibold text-blue-900">
          Klinik görseli
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
                <MapPin className="h-4 w-4" /> {clinic.city}, {clinic.district} · {clinic.distanceKm} km
              </p>
            </div>
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-left md:text-right">
              {clinic.google.rating ? (
                <p className="flex items-center gap-1 font-semibold text-blue-950 md:justify-end">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {clinic.google.rating.toFixed(1)} Google
                </p>
              ) : (
                <p className="text-sm text-slate-500">Google puanı alınamıyor</p>
              )}
              <p className="text-xs text-slate-500">{clinic.google.reviewCount ?? 0} değerlendirme</p>
            </div>
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Başlangıç fiyatı</p>
              <p className="mt-1 font-semibold text-slate-950">{priceText}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">İşlem</p>
              <p className="mt-1 font-semibold text-slate-950">{firstPrice?.treatmentName ?? clinic.treatments[0]}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">İlk muayene</p>
              <p className="mt-1 font-semibold text-slate-950">{clinic.freeInitialExam ? "Ücretsiz" : formatMoney(clinic.firstExamFee)}</p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs text-slate-500">En yakın uygunluk</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-slate-950"><CalendarDays className="h-4 w-4" /> {formatDate(clinic.nextAvailableAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {clinic.patientPerks.slice(0, 3).map((perk) => (
              <span key={perk} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1">
                <ShieldCheck className="h-3 w-3 text-emerald-700" /> {perk}
              </span>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
            <Link href={`/randevu-talebi?clinic=${clinic.slug}&treatment=${encodeURIComponent(firstPrice?.treatmentName ?? clinic.treatments[0])}`} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              Randevu iste <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href={`/fiyat-teklifi?clinics=${clinic.slug}&treatment=${encodeURIComponent(firstPrice?.treatmentName ?? clinic.treatments[0])}&city=${encodeURIComponent(clinic.city)}`} className="inline-flex items-center justify-center rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-800">
              Fiyat teklifi al
            </Link>
            <Link href={`/klinikler/${clinic.slug}`} className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              Detay
            </Link>
            <Link href={`/karsilastir?clinics=${clinic.slug}`} className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
              <GitCompare className="h-4 w-4" /> Karşılaştır
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
