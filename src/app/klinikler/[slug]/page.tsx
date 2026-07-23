import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cookies } from "next/headers";
import { CheckCircle2, ExternalLink, MapPin, MessageCircle, Phone, Star, Tags } from "lucide-react";
import { FavoriteButton } from "@/components/clinic/favorite-button";
import { GoogleReviewLink } from "@/components/google/google-review-link";
import { GoogleAttribution } from "@/components/google/google-attribution";
import { MedicalNotice } from "@/components/ui/notice";
import { formatDate, formatMoney } from "@/lib/format";
import { getContactLinks } from "@/lib/contact-links";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getPublishedClinicBySlug } from "@/services/clinics/public-clinics";

type ClinicPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ClinicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const clinic = await prisma.clinic.findFirst({ where: { slug, isPublished: true }, select: { name: true, description: true, city: true, district: true, coverImageUrl: true } });
  if (!clinic) return {};
  const title = `${clinic.name} | ${clinic.district}, ${clinic.city} Diş Kliniği`;
  const description = clinic.description?.slice(0, 160) || `${clinic.name} tedavileri, ilk muayene ücreti, klinik olanakları ve doğrulanmış Google bilgileri.`;
  return { title, description, alternates: { canonical: `/klinikler/${slug}` }, openGraph: { title, description, type: "website", images: clinic.coverImageUrl ? [clinic.coverImageUrl] : ["/og.png"] } };
}

export default async function ClinicPage({ params }: ClinicPageProps) {
  const { slug } = await params;
  const clinic = await getPublishedClinicBySlug(slug);
  if (!clinic) notFound();
  const currentUser = await getCurrentUser();
  const favorite = currentUser?.role === "PATIENT"
    ? await prisma.favorite.findFirst({ where: { userId: currentUser.id, clinic: { slug } }, select: { id: true } })
    : null;
  const hasLiveGoogleData = !clinic.google.isDemoData && clinic.google.rating !== null;
  const selectedTreatment = clinic.prices[0]?.treatmentName ?? clinic.treatments[0] ?? "Genel muayene";
  const contact = getContactLinks(clinic.phone, clinic.whatsapp);
  const infoSections = [
    ["Hasta olanakları", clinic.patientPerks],
    ["Teknoloji", clinic.technologyHighlights],
    ["Sterilizasyon ve hijyen", clinic.hygieneHighlights],
  ].filter(([, items]) => (items as string[]).length > 0);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinic.name,
    description: clinic.description,
    address: { "@type": "PostalAddress", streetAddress: clinic.address, addressLocality: clinic.district, addressRegion: clinic.city, addressCountry: "TR" },
    telephone: clinic.phone,
    url: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/klinikler/${clinic.slug}`,
    ...(hasLiveGoogleData ? { aggregateRating: { "@type": "AggregateRating", ratingValue: clinic.google.rating, reviewCount: clinic.google.reviewCount } } : {}),
  };
  const analyticsConsent = (await cookies()).get("discibul_consent")?.value === "v1.analytics";

  if (analyticsConsent) {
    after(async () => {
      const record = await prisma.clinic.findUnique({ where: { slug }, select: { id: true } });
      if (record) await prisma.analyticsEvent.create({ data: { clinicId: record.id, type: "PROFILE_VIEW" } });
    });
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div
          className="flex min-h-56 items-end bg-blue-50 bg-cover bg-center p-6"
          style={clinic.coverImageUrl ? { backgroundImage: `linear-gradient(rgba(255,255,255,.72), rgba(255,255,255,.88)), url(${clinic.coverImageUrl})` } : undefined}
        >
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {clinic.verified ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış klinik</span> : null}
              {clinic.freeInitialExam ? <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">İlk muayene ücretsiz</span> : null}
              <span className={`rounded px-2 py-1 text-xs font-medium ${clinic.openNow ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{clinic.openNow ? "Şu an açık" : "Şu an kapalı"}</span>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{hasLiveGoogleData ? "Google işletme profili bağlı" : "Google işletme bağlantısı bekleniyor"}</span>
            </div>
            <h1 className="text-3xl font-semibold text-slate-950">{clinic.name}</h1>
            <p className="mt-2 flex items-center gap-1 text-slate-700"><MapPin className="h-4 w-4" /> {clinic.address}</p>
            {clinic.description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{clinic.description}</p> : null}
          </div>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <MedicalNotice />
            <section className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="text-sm text-blue-800">İlk muayene</p>
                <p className="mt-1 text-2xl font-semibold text-blue-950">{clinic.freeInitialExam ? "Ücretsiz" : clinic.firstExamFee === null ? "Belirtilmedi" : formatMoney(clinic.firstExamFee)}</p>
                {clinic.initialExamIncludes.length ? <p className="mt-2 text-xs text-blue-800">{clinic.initialExamIncludes.join(" · ")}</p> : null}
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm text-emerald-800">Teklif dönüş süresi</p>
                <p className="mt-1 text-xl font-semibold text-emerald-950">{clinic.responseTimeHours === null ? "Henüz ölçülmedi" : `${clinic.responseTimeHours} saat`}</p>
                <p className="mt-2 text-xs text-emerald-800">Yeterli yanıt verisi oluştuğunda hesaplanır.</p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-white p-4">
                <p className="text-sm text-slate-500">Ödeme seçenekleri</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{clinic.financingOptions.length ? clinic.financingOptions.join(", ") : "Klinikten bilgi alın"}</p>
              </div>
            </section>
            {clinic.campaigns.length || clinic.packages.length ? <section><div className="flex items-center gap-2"><Tags className="h-5 w-5 text-emerald-700" /><h2 className="text-xl font-semibold">Kampanyalar ve paketler</h2></div><div className="mt-3 grid gap-4 md:grid-cols-2">{clinic.campaigns.map((campaign) => <article key={campaign.id} className="border-l-4 border-blue-600 bg-blue-50 px-4 py-3"><p className="font-semibold text-blue-950">{campaign.title}</p><p className="mt-1 text-sm leading-6 text-blue-900">{campaign.description || "Ayrıntılar için klinikle iletişime geçin."}</p>{campaign.endsAt ? <p className="mt-2 text-xs text-blue-700">Son gün: {formatDate(campaign.endsAt)}</p> : null}</article>)}{clinic.packages.map((item) => <article key={item.id} className="border-l-4 border-emerald-600 bg-emerald-50 px-4 py-3"><p className="font-semibold text-emerald-950">{item.name}</p>{item.treatmentName ? <p className="mt-0.5 text-xs font-medium text-emerald-800">{item.treatmentName}</p> : null}<p className="mt-1 text-sm leading-6 text-emerald-900">{item.description || "Paket kapsamı için klinikle iletişime geçin."}</p><p className="mt-2 font-semibold text-emerald-950">{item.price === null ? "Muayene sonrası" : formatMoney(item.price, item.currency)}</p></article>)}</div></section> : null}
            <section>
              <h2 className="text-xl font-semibold">Tedaviler ve fiyatlar</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-emerald-100 bg-emerald-50 p-4"><h3 className="text-sm font-semibold text-emerald-950">Klinik beyanına göre yapılıyor</h3>{clinic.treatments.length ? <div className="mt-2 flex flex-wrap gap-1.5">{clinic.treatments.map((item) => <span key={item} className="rounded bg-white px-2 py-1 text-xs text-emerald-900">{item}</span>)}</div> : <p className="mt-2 text-xs text-emerald-900">Tedavi kapsamı belirtilmedi.</p>}</div>
                <div className="rounded-md border border-red-100 bg-red-50 p-4"><h3 className="text-sm font-semibold text-red-950">Klinik beyanına göre yapılmıyor</h3>{clinic.unavailableTreatments.length ? <div className="mt-2 flex flex-wrap gap-1.5">{clinic.unavailableTreatments.map((item) => <span key={item} className="rounded bg-white px-2 py-1 text-xs text-red-900">{item}</span>)}</div> : <p className="mt-2 text-xs text-red-900">Yapılmayan tedavi bilgisi belirtilmedi.</p>}</div>
              </div>
              {clinic.prices.length ? <div className="mt-3 grid gap-3">
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
              </div> : <div className="mt-3 rounded-md border border-dashed border-blue-200 p-4 text-sm text-slate-600">Onaylanmış fiyat bilgisi henüz bulunmuyor.</div>}
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              {infoSections.map(([title, items]) => (
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
              {clinic.doctors.length ? <div className="mt-3 grid gap-3 md:grid-cols-2">
                {clinic.doctors.map((doctor) => (
                  <Link key={doctor.slug} href={`/doktorlar/${doctor.slug}`} className="rounded-md border border-slate-200 p-4 hover:border-blue-300">
                    <p className="font-semibold">{doctor.fullName}</p>
                    <p className="text-sm text-slate-600">{doctor.title} · {doctor.experienceYears} yıl deneyim</p>
                    <p className="mt-2 text-sm text-slate-600">Çalıştığı kliniğin Google puanı: {hasLiveGoogleData ? clinic.google.rating : "şu anda alınamıyor"}</p>
                  </Link>
                ))}
              </div> : <p className="mt-3 text-sm text-slate-600">Doğrulanmış hekim profili henüz eklenmedi.</p>}
            </section>
            {clinic.google.reviews?.length ? <section>
              <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Google&apos;dan son yorumlar</h2><GoogleAttribution /></div>
              <p className="mt-1 text-xs leading-5 text-slate-500">Klinik yöneticisinin bağladığı doğrulanmış Google İşletme Profili&apos;nden alınır. En son 5 yorum gösterilir.</p>
              <div className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {clinic.google.reviews.map((review) => <article key={review.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-slate-950">{review.authorName}</p><p className="text-sm font-semibold text-amber-700">{review.rating} / 5</p></div>
                  {review.publishedAt ? <p className="mt-1 text-xs text-slate-500">{formatDate(review.publishedAt)}</p> : null}
                  {review.text ? <p className="mt-2 text-sm leading-6 text-slate-700">{review.text}</p> : <p className="mt-2 text-sm text-slate-500">Yalnızca puan verildi.</p>}
                  {review.clinicResponse ? <div className="mt-3 border-l-2 border-blue-300 pl-3"><p className="text-xs font-semibold text-blue-900">Klinik yanıtı</p><p className="mt-1 text-sm leading-6 text-slate-700">{review.clinicResponse}</p></div> : null}
                  {review.sourceUrl ? <a href={review.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-700">Google&apos;da görüntüle <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                </article>)}
              </div>
            </section> : null}
          </div>
          <aside className="space-y-4">
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">Google puanı</h2>
              {hasLiveGoogleData ? (
                <p className="mt-2 flex items-center gap-2 text-2xl font-semibold"><Star className="h-5 w-5 fill-amber-400 text-amber-400" /> {clinic.google.rating?.toFixed(1)} / 5</p>
              ) : <p className="mt-2 text-sm text-slate-600">Google puanı şu anda alınamıyor.</p>}
              {hasLiveGoogleData ? <><p className="text-sm text-slate-600">{clinic.google.reviewCount} Google değerlendirmesi</p><p className="mt-2 text-xs text-slate-500">Son senkronizasyon: {clinic.google.lastSyncedAt ? formatDate(clinic.google.lastSyncedAt) : "Yok"}</p></> : <p className="mt-3 text-xs leading-5 text-slate-500">Klinik doğru Google işletme profiliyle eşleştirildiğinde puan ve değerlendirme sayısı burada görünür.</p>}
              {clinic.google.mapsUrl || clinic.google.writeReviewUrl ? <div className="mt-4 grid gap-2">{clinic.google.placeId ? <Link href={`/google-klinik/${encodeURIComponent(clinic.google.placeId)}`} className="inline-flex items-center justify-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Google Maps yorumlarını incele</Link> : null}{clinic.google.mapsUrl ? <a href={clinic.google.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">{"Google Maps'te tüm yorumları gör"} <ExternalLink className="h-4 w-4" /></a> : null}{clinic.google.writeReviewUrl ? <GoogleReviewLink href={clinic.google.writeReviewUrl} /> : null}</div> : null}
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">İletişim</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                {contact.callHref ? <a href={contact.callHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 font-semibold text-white"><Phone className="h-4 w-4" /> Ara · {clinic.phone}</a> : null}
                {contact.messageHref ? <a href={contact.messageHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> Mesaj at</a> : null}
                {contact.whatsappHref ? <a href={contact.whatsappHref} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-md border border-emerald-200 px-3 py-2 font-semibold text-emerald-800">WhatsApp</a> : null}
                {clinic.email ? <a href={`mailto:${clinic.email}`} className="font-medium text-blue-700">{clinic.email}</a> : null}
                {clinic.website ? <a href={clinic.website} target="_blank" rel="noreferrer" className="font-medium text-blue-700">Klinik web sitesi</a> : null}
                {!clinic.phone && !clinic.email && !clinic.website ? <p className="text-slate-500">İletişim bilgisi henüz eklenmedi.</p> : null}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="font-semibold">Randevu veya teklif</h2>
              <p className="mt-2 text-sm text-slate-600">İlk uygun randevu: {clinic.nextAvailableAt ? formatDate(clinic.nextAvailableAt) : "Klinikten bilgi alın"}</p>
              <div className="mt-4 grid gap-2">
                <Link href={`/randevu-talebi?clinic=${clinic.slug}&treatment=${encodeURIComponent(selectedTreatment)}`} className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white">Randevu iste</Link>
                <Link href={`/fiyat-teklifi?clinics=${clinic.slug}&treatment=${encodeURIComponent(selectedTreatment)}&city=${encodeURIComponent(clinic.city)}`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium">Fiyat teklifi al</Link>
                {currentUser?.role === "PATIENT" ? <FavoriteButton clinicSlug={clinic.slug} initialFavorite={Boolean(favorite)} /> : <Link href={`/auth/giris?tip=hasta&next=${encodeURIComponent(`/klinikler/${clinic.slug}`)}`} className="rounded-md border border-slate-300 px-3 py-2 text-center text-sm font-medium">Favorilere eklemek için giriş yap</Link>}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
