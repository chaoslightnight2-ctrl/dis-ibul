import Link from "next/link";
import { Clock3, ExternalLink, Globe2, MapPin, MessageCircle, Phone, Star, Stethoscope, ChevronRight } from "lucide-react";
import type { OpenStreetMapClinic } from "@/domain/types";
import { getContactLinks } from "@/lib/contact-links";

export function OsmClinicCard({ clinic }: { clinic: OpenStreetMapClinic }) {
  const contact = getContactLinks(clinic.phone);
  const hasCachedGoogleRating = typeof clinic.googleRating === "number";
  return (
    <article className="rounded-lg border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-blue-950">{clinic.name}</h3>
            <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">İnternette bulunan klinik</span>
          </div>
          {hasCachedGoogleRating ? (
            <a
              href={clinic.googleRatingUrl || clinic.googleSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
            >
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {clinic.googleRating?.toFixed(1)} Google
              {clinic.googleReviewCount ? <span className="text-amber-700">({clinic.googleReviewCount})</span> : null}
            </a>
          ) : null}
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-blue-700" /> {clinic.formattedAddress}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
        {contact.callHref ? <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {clinic.phone}</span> : null}
        {clinic.openingHours ? <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {clinic.openingHours}</span> : null}
        {clinic.specialties.length ? <span className="inline-flex items-center gap-1.5"><Stethoscope className="h-4 w-4" /> Kaynakta belirtilen: {clinic.specialties.join(", ")}</span> : null}
      </div>

      <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        {clinic.specialties.length
          ? "Bunlar OpenStreetMap kaydında belirtilen uzmanlık veya tedavi etiketleridir; tam hizmet listesini klinikten doğrulayın. Yapılmayan tedaviler kaynakta belirtilmiyor."
          : "Tedavi ve yapılmayan tedavi bilgisi kaynakta belirtilmedi; randevu öncesi klinikten doğrulayın."}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {contact.callHref ? <a href={contact.callHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Ara</a> : null}
        {contact.messageHref ? <a href={contact.messageHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> Mesaj at</a> : null}
        <a href={clinic.osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
          Haritada aç <ExternalLink className="h-4 w-4" />
        </a>
        <a href={clinic.googleSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-800">
          Google&apos;da ara <ExternalLink className="h-4 w-4" />
        </a>
        {clinic.websiteUrl ? <a href={clinic.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"><Globe2 className="h-4 w-4" /> Web sitesi</a> : null}
        <Link
          href={`/dis-klinikleri/${encodeURIComponent(clinic.city ?? "")}/${clinic.osmType}-${clinic.osmId}`}
          className="inline-flex items-center justify-center gap-1 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
        >
          Detay <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Bu işletme DişçiBul&apos;a kayıtlı değildir. Konum ve telefon bilgileri OpenStreetMap kaydında yayınlandığı ölçüde gösterilir; aramadan önce bilgileri klinikten doğrulayın.
      </p>
    </article>
  );
}
