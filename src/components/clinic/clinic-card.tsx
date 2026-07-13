import Link from "next/link";
import { CalendarDays, GitCompare, Heart, MapPin, Star } from "lucide-react";
import type { Clinic } from "@/domain/types";
import { formatDate, formatMoney } from "@/lib/format";

export function ClinicCard({ clinic }: { clinic: Clinic }) {
  const firstPrice = clinic.prices[0];

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex h-36 min-w-44 items-center justify-center rounded-md bg-gradient-to-br from-teal-100 via-white to-sky-100 text-sm font-semibold text-teal-900">
          Klinik görseli
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-950">{clinic.name}</h2>
                {clinic.verified ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış</span> : null}
                {clinic.sponsored ? <span className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white">Sponsorlu</span> : null}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="h-4 w-4" /> {clinic.city}, {clinic.district} · {clinic.distanceKm} km
              </p>
            </div>
            <div className="text-right">
              {clinic.google.rating ? (
                <p className="flex items-center justify-end gap-1 font-semibold text-slate-950">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Google puanı {clinic.google.rating.toFixed(1)}
                </p>
              ) : (
                <p className="text-sm text-slate-500">Google puanı şu anda alınamıyor</p>
              )}
              <p className="text-xs text-slate-500">{clinic.google.reviewCount ?? 0} Google değerlendirmesi</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {clinic.specialties.slice(0, 3).map((specialty) => (
              <span key={specialty} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{specialty}</span>
            ))}
          </div>
          <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <p><strong>Fiyat:</strong> {firstPrice?.fixedPrice ? formatMoney(firstPrice.fixedPrice) : `${formatMoney(firstPrice.minPrice ?? 0)} - ${formatMoney(firstPrice.maxPrice ?? 0)}`}</p>
            <p><strong>İşlem:</strong> {firstPrice?.treatmentName}</p>
            <p className="flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(clinic.nextAvailableAt)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/klinikler/${clinic.slug}`} className="rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white">Profili gör</Link>
            <Link href={`/karsilastir?clinics=${clinic.slug}`} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><GitCompare className="h-4 w-4" /> Karşılaştır</Link>
            <Link href={`/fiyat-teklifi?clinics=${clinic.slug}&treatment=${encodeURIComponent(firstPrice?.treatmentName ?? clinic.treatments[0])}&city=${encodeURIComponent(clinic.city)}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Fiyat teklifi al</Link>
            <Link href={`/randevu-talebi?clinic=${clinic.slug}&treatment=${encodeURIComponent(firstPrice?.treatmentName ?? clinic.treatments[0])}`} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Randevu iste</Link>
            <Link href={`/auth/giris?next=/klinikler/${clinic.slug}`} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><Heart className="h-4 w-4" /> Favori</Link>
          </div>
        </div>
      </div>
    </article>
  );
}
