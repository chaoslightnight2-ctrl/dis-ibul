import { ExternalLink, Globe2, MapPin, Phone, Star, Clock3 } from "lucide-react";
import type { GooglePlaceSearchResult } from "@/domain/types";

export function GooglePlaceCard({ place }: { place: GooglePlaceSearchResult }) {
  return (
    <article className="rounded-lg border border-amber-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-blue-950">{place.name}</h3>
            <span className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">Google Places</span>
          </div>
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-700" /> {place.formattedAddress}
          </p>
        </div>

        {/* ★ YILDIZ */}
        {place.rating ? (
          <div className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center">
            <p className="flex items-center gap-1 text-lg font-bold text-amber-900">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {place.rating.toFixed(1)}
            </p>
            <p className="text-xs text-amber-700">{place.reviewCount} yorum</p>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        {place.phone ? <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {place.phone}</span> : null}
        {place.openNow !== null ? (
          <span className={`inline-flex items-center gap-1.5 ${place.openNow ? "text-emerald-700" : "text-slate-500"}`}>
            <Clock3 className="h-4 w-4" />
            {place.openNow ? "Şu an açık" : "Şu an kapalı"}
          </span>
        ) : null}
        {place.businessStatus === "CLOSED_PERMANENTLY" ? (
          <span className="inline-flex items-center gap-1.5 text-red-600 font-medium">Kalıcı olarak kapalı</span>
        ) : null}
        {place.businessStatus === "CLOSED_TEMPORARILY" ? (
          <span className="inline-flex items-center gap-1.5 text-amber-600 font-medium">Geçici olarak kapalı</span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {place.phone ? (
          <a href={`tel:${place.phone}`} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
            <Phone className="h-4 w-4" /> Ara
          </a>
        ) : null}
        <a href={place.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">
          Google Maps <ExternalLink className="h-4 w-4" />
        </a>
        {place.writeReviewUrl ? (
          <a href={place.writeReviewUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-sm font-medium text-amber-800">
            Yorum yaz
          </a>
        ) : null}
        {place.websiteUrl ? (
          <a href={place.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
            <Globe2 className="h-4 w-4" /> Web sitesi
          </a>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Bu işletme DişçiBul&apos;a kayıtlı değildir. Bilgiler Google Places kaynağından alınır.
      </p>
    </article>
  );
}
