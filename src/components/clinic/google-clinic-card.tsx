import Link from "next/link";
import { ExternalLink, MapPin, MessageCircle, MessageSquareText, Phone, Star } from "lucide-react";
import { GoogleAttribution } from "@/components/google/google-attribution";
import type { GooglePlaceSearchResult } from "@/domain/types";
import { getContactLinks } from "@/lib/contact-links";

export function GoogleClinicCard({ place }: { place: GooglePlaceSearchResult }) {
  const contact = getContactLinks(place.phone);
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-950">{place.name}</h3>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">Google&apos;da bulunan klinik</span>
            {place.openNow !== null ? (
              <span className={`rounded px-2 py-1 text-xs font-medium ${place.openNow ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
                {place.openNow ? "Şu an açık" : "Şu an kapalı"}
              </span>
            ) : null}
          </div>
          <p className="mt-2 flex items-start gap-1 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0" /> {place.formattedAddress}
          </p>
          {place.phone ? <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><Phone className="h-4 w-4" /> {place.phone}</p> : <p className="mt-1 text-xs text-slate-500">Google kaydında telefon numarası yok.</p>}
        </div>
        <div className="min-w-40 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 md:text-right">
          {place.rating === null ? (
            <p className="text-sm text-slate-600">Puan bilgisi yok</p>
          ) : (
            <p className="flex items-center gap-1 font-semibold text-slate-950 md:justify-end">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {place.rating.toFixed(1)} / 5
            </p>
          )}
          <p className="mt-0.5 text-xs text-slate-600">{place.reviewCount.toLocaleString("tr-TR")} değerlendirme</p>
          <GoogleAttribution className="mt-1 inline-block" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {contact.callHref ? <a href={contact.callHref} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Ara</a> : null}
        {contact.messageHref ? <a href={contact.messageHref} className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> Mesaj at</a> : null}
        <Link
          href={`/google-klinik/${encodeURIComponent(place.placeId)}`}
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        >
          <MessageSquareText className="h-4 w-4" /> Yorumları incele
        </Link>
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
        >
          Haritada aç <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        Tedavi ve yapılmayan tedavi listesi Google Places kaydında doğrulanabilir alan olarak sunulmaz. Hizmet kapsamını klinikten doğrulayın.
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Bu işletme henüz DişçiBul randevu ve fiyat sistemine bağlı değil. Adres, puan ve değerlendirme sayısı Google Maps tarafından sağlanır.
      </p>
    </article>
  );
}
