import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock3, ExternalLink, Globe2, MapPin, MessageCircle, Phone, Star, Stethoscope } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { brand } from "@/config/brand";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getContactLinks } from "@/lib/contact-links";
import { getActiveOsmClinicByRef } from "@/services/osm/clinic-index";
import { OsmDetailMap } from "./detail-map";

type PageProps = { params: Promise<{ city: string; osmSlug: string }> };

function parseOsmSlug(slug: string): { type: "node" | "way" | "relation"; id: number } | null {
  const match = slug.match(/^(node|way|relation)-(\d+)$/);
  if (!match) return null;
  return { type: match[1] as "node" | "way" | "relation", id: Number(match[2]) };
}

function toTitleCase(value: string) {
  return value.charAt(0).toLocaleUpperCase("tr-TR") + value.slice(1);
}

async function readClinic(params: PageProps["params"]) {
  const { city: citySlug, osmSlug } = await params;
  const city = toTitleCase(decodeURIComponent(citySlug));
  const parsed = parseOsmSlug(osmSlug);
  if (!isTurkeyCity(city) || !parsed) return null;
  const clinic = await getActiveOsmClinicByRef(parsed.type, parsed.id);
  if (!clinic || clinic.city?.toLocaleLowerCase("tr-TR") !== city.toLocaleLowerCase("tr-TR")) return null;
  return { city, citySlug, clinic };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await readClinic(params);
  if (!result) return {};
  const { clinic, city } = result;
  return {
    title: `${clinic.name} | ${city} Diş Kliniği | ${brand.name}`,
    description: `${clinic.name} - ${city} bölgesinde diş kliniği. Konum ve iletişim bilgileri.`,
  };
}

export default async function OsmClinicDetailPage({ params }: PageProps) {
  const result = await readClinic(params);
  if (!result) notFound();

  const { clinic, city, citySlug } = result;
  const contact = getContactLinks(clinic.phone);
  const hasRating = typeof clinic.googleRating === "number";

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: city, href: `/dis-klinikleri/${citySlug}` }, { label: clinic.name }]} />
          <div className="mt-4">
            <Link href={`/dis-klinikleri/${citySlug}`} className="inline-flex min-h-11 items-center gap-1 text-sm text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" /> {city} kliniklerine dön
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-blue-950">{clinic.name}</h1>
              <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">Açık kaynak verisi</span>

              <div className="mt-4">
                <a
                  href={clinic.googleRatingUrl || clinic.googleSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
                >
                  {hasRating ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <ExternalLink className="h-4 w-4" />}
                  {hasRating ? `${clinic.googleRating?.toFixed(1)} Google (${clinic.googleReviewCount ?? 0})` : "Google yorumlarını gör"}
                </a>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                  <div><p className="font-medium text-blue-950">Adres</p><p className="text-sm text-slate-600">{clinic.formattedAddress}</p></div>
                </div>
                {clinic.phone ? (
                  <div className="flex items-start gap-3"><Phone className="mt-1 h-5 w-5 shrink-0 text-blue-700" /><div><p className="font-medium text-blue-950">Telefon</p><a href={contact.callHref!} className="text-sm text-blue-700 hover:underline">{clinic.phone}</a></div></div>
                ) : null}
                {clinic.openingHours ? (
                  <div className="flex items-start gap-3"><Clock3 className="mt-1 h-5 w-5 shrink-0 text-blue-700" /><div><p className="font-medium text-blue-950">Çalışma saatleri</p><p className="text-sm text-slate-600">{clinic.openingHours}</p></div></div>
                ) : null}
                {clinic.specialties.length ? (
                  <div className="flex items-start gap-3"><Stethoscope className="mt-1 h-5 w-5 shrink-0 text-blue-700" /><div><p className="font-medium text-blue-950">Kaynakta belirtilen hizmetler</p><p className="text-sm text-slate-600">{clinic.specialties.slice(0, 3).map((item) => item.replaceAll("_", " ")).join(", ")}</p></div></div>
                ) : <p className="text-sm text-slate-500">Tedavi bilgisi doğrulanmadı.</p>}
                {clinic.websiteUrl ? (
                  <div className="flex items-start gap-3"><Globe2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" /><div><p className="font-medium text-blue-950">Web sitesi</p><a href={clinic.websiteUrl} target="_blank" rel="noreferrer" className="break-all text-sm text-blue-700 hover:underline">{clinic.websiteUrl}</a></div></div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {contact.callHref ? <a href={contact.callHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"><Phone className="h-4 w-4" /> Ara</a> : null}
                {contact.messageHref ? <a href={contact.messageHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><MessageCircle className="h-4 w-4" /> WhatsApp</a> : null}
                <a href={clinic.osmUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">Yol tarifi <ExternalLink className="h-4 w-4" /></a>
              </div>
            </div>

            <div className="mt-6"><OpenStreetMapSourceNotice /></div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
              <div className="border-b border-blue-100 px-4 py-3"><h2 className="font-semibold text-blue-950">Konum</h2></div>
              <OsmDetailMap latitude={clinic.latitude} longitude={clinic.longitude} name={clinic.name} />
              <div className="border-t border-blue-100 px-4 py-2"><OpenStreetMapAttribution /></div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
