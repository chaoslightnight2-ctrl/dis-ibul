import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Flag, Globe2, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { GoogleAttribution } from "@/components/google/google-attribution";
import { GoogleReviewLink } from "@/components/google/google-review-link";
import { googlePlaceIdSchema } from "@/domain/validation";
import { getContactLinks } from "@/lib/contact-links";
import { GooglePlacesError, getGooglePlacesClient } from "@/services/google/places";

type GoogleClinicPageProps = {
  params: Promise<{ placeId: string }>;
};

export const dynamic = "force-dynamic";

function stars(rating: number) {
  return `${rating.toFixed(1)} / 5`;
}

export default async function GoogleClinicPage({ params }: GoogleClinicPageProps) {
  const parsed = googlePlaceIdSchema.safeParse((await params).placeId);
  if (!parsed.success) notFound();

  let place;
  try {
    place = await getGooglePlacesClient().getPlaceDetails(parsed.data);
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      const rateLimited = error.code === "RATE_LIMITED";
      return (
        <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <section className="rounded-lg border border-blue-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-blue-950">{rateLimited ? "Ücretsiz Google kotası doldu" : "Google Maps bağlantısına ulaşılamıyor"}</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">{rateLimited ? "Ek ücret oluşmaması için Google yorum isteği durduruldu. Yeni aylık dönem başladığında tekrar deneyebilirsiniz." : "Bu klinik için güncel yorumlar şu anda alınamıyor. Veri uydurulmadan ücretsiz klinik aramasına dönebilirsiniz."}</p>
            <Link href="/arama" className="mt-5 inline-flex rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white">Klinik aramasına dön</Link>
          </section>
        </main>
      );
    }
    throw error;
  }

  const contact = getContactLinks(place.phone);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-slate-950">{place.name}</h1>
              {place.openNow !== null ? <span className={`rounded px-2 py-1 text-xs font-medium ${place.openNow ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{place.openNow ? "Şu an açık" : "Şu an kapalı"}</span> : null}
            </div>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-slate-600"><MapPin className="mt-1 h-4 w-4 shrink-0" /> {place.formattedAddress}</p>
          </div>
          <div className="rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-right">
            <p className="flex items-center justify-end gap-1 text-xl font-semibold text-slate-950"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {place.rating === null ? "Puan yok" : stars(place.rating)}</p>
            <p className="mt-1 text-sm text-slate-600">{place.reviewCount.toLocaleString("tr-TR")} değerlendirme</p>
            <GoogleAttribution className="mt-1 inline-block" />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={place.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Google Maps&apos;te aç <ExternalLink className="h-4 w-4" /></a>
          {contact.callHref ? <a href={contact.callHref} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><Phone className="h-4 w-4" /> Ara · {place.phone}</a> : null}
          {contact.messageHref ? <a href={contact.messageHref} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> Mesaj at</a> : null}
          {place.websiteUrl ? <a href={place.websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"><Globe2 className="h-4 w-4" /> Web sitesi</a> : null}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold text-slate-950">Google Maps yorumları</h2><GoogleAttribution /></div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Google Places en fazla beş yorumu ilgililik sırasına göre sağlar; bu liste tüm yorumlar veya kronolojik bir sıralama değildir.</p>
          </div>

          {place.reviews.length ? place.reviews.map((review) => (
            <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                {review.authorPhotoUri ? (
                  // Google requires the supplied author photo to remain associated with the review.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={review.authorPhotoUri} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : <div aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-800">{review.authorName.slice(0, 1).toLocaleUpperCase("tr-TR")}</div>}
                <div className="min-w-0 flex-1">
                  {review.authorUri ? <a href={review.authorUri} target="_blank" rel="noreferrer" className="font-semibold text-slate-950 hover:text-blue-700">{review.authorName}</a> : <p className="font-semibold text-slate-950">{review.authorName}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1 font-medium text-slate-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {review.rating.toFixed(1)}</span>{review.relativePublishTime ? <span>{review.relativePublishTime}</span> : null}{review.visitDate ? <span>Ziyaret: {review.visitDate}</span> : null}</div>
                </div>
              </div>
              {review.text ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{review.text}</p> : <p className="mt-3 text-sm text-slate-500">Yalnızca puan verildi.</p>}
              {review.translated ? <details className="mt-3 rounded-md bg-slate-50 p-3 text-xs text-slate-600"><summary className="cursor-pointer font-medium text-slate-700">Google tarafından çevrilmiş yorum, özgün metni göster</summary><p className="mt-2 whitespace-pre-line leading-5">{review.originalText}</p></details> : null}
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3 text-xs">
                <a href={review.googleMapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-700">Yorumu Google Maps&apos;te gör <ExternalLink className="h-3.5 w-3.5" /></a>
                {review.flagContentUri ? <a href={review.flagContentUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-slate-500"><Flag className="h-3.5 w-3.5" /> Yorumu bildir</a> : null}
                <GoogleAttribution className="ml-auto" />
              </div>
            </article>
          )) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">Google Places bu işletme için gösterilebilir yorum döndürmedi. Tüm yorumları Google Maps&apos;te inceleyebilirsiniz.</div>
          )}
        </section>

        <aside className="space-y-4">
          {place.writeReviewUrl ? <GoogleReviewLink href={place.writeReviewUrl} /> : null}
          {place.weekdayDescriptions.length ? <section className="rounded-lg border border-slate-200 bg-white p-4"><h2 className="font-semibold text-slate-950">Çalışma saatleri</h2><ul className="mt-3 grid gap-2 text-sm text-slate-600">{place.weekdayDescriptions.map((line) => <li key={line}>{line}</li>)}</ul><GoogleAttribution className="mt-3 inline-block" /></section> : null}
          <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-950">
            Yorumlar DişçiBul tarafından doğrulanmaz. Google sahte içerik tespit edildiğinde inceleme ve kaldırma işlemleri uygular. Her yorumun kaynak ve bildirim bağlantısı yukarıda yer alır.
          </section>
        </aside>
      </div>
    </main>
  );
}
