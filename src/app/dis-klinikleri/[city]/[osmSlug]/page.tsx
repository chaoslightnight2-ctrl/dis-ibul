import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Globe2, MapPin, Phone, Stethoscope } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { GoogleRatingBadge } from "@/components/google/google-rating-badge";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { brand } from "@/config/brand";
import { isTurkeyCity } from "@/config/turkey-cities";
import { getContactLinks } from "@/lib/contact-links";
import { OsmDetailMap } from "./detail-map";

type PageProps = { params: Promise<{ city: string; osmSlug: string }> };

function parseOsmSlug(slug: string): { type: string; id: number } | null {
  const match = slug.match(/^(node|way|relation)-(\d+)$/);
  if (!match) return null;
  return { type: match[1]!, id: parseInt(match[2]!, 10) };
}

function toTitleCase(str: string) {
  return str.charAt(0).toLocaleUpperCase("tr-TR") + str.slice(1);
}

async function fetchOsmElement(osmType: string, osmId: number) {
  const query = `[out:json][timeout:10];(${osmType}(${osmId}););out center;`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "Discibul/1.0",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) return null;

  const raw = (await response.json()) as { elements?: Array<{
    type: string; id: number; lat?: number; lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }> };

  return raw.elements?.[0] ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug, osmSlug } = await params;
  const city = toTitleCase(slug);
  const parsed = parseOsmSlug(osmSlug);
  if (!isTurkeyCity(city) || !parsed) return {};
  const element = await fetchOsmElement(parsed.type, parsed.id);
  const name = element?.tags?.name || osmSlug;
  return {
    title: `${name} | ${city} Diş Kliniği | ${brand.name}`,
    description: `${name} - ${city} bölgesinde diş kliniği. Konum ve iletişim bilgileri.`,
  };
}

export default async function OsmClinicDetailPage({ params }: PageProps) {
  const { city: slug, osmSlug } = await params;
  const city = toTitleCase(slug);
  const parsed = parseOsmSlug(osmSlug);

  if (!isTurkeyCity(city) || !parsed) notFound();

  const element = await fetchOsmElement(parsed.type, parsed.id);
  if (!element) notFound();

  const tags = element.tags ?? {};
  const name = tags.name || tags.operator || tags.brand || osmSlug;
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (typeof latitude !== "number" || typeof longitude !== "number") notFound();

  const phone = tags["contact:phone"] || tags.phone || null;
  const websiteUrl = tags["contact:website"] || tags.website || null;
  const contact = getContactLinks(phone);
  const specialties: string[] = (tags["healthcare:speciality"] || "")
    .split(";").map((s) => s.trim()).filter(Boolean);
  const osmUrl = `https://www.openstreetmap.org/${parsed.type}/${parsed.id}`;

  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const addressParts = [
    street,
    tags["addr:neighbourhood"] || tags["addr:quarter"] || tags["addr:suburb"],
    tags["addr:district"],
    tags["addr:city"] || tags["addr:province"] || city,
  ].filter(Boolean);
  const formattedAddress = [...new Set(addressParts)].join(", ") || "Adres OpenStreetMap üzerinde görüntülenebilir.";

  // OSM bağlantısına kopyalama
  const googleSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${formattedAddress}`)}`;

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: city, href: `/dis-klinikleri/${slug}` },
            { label: name },
          ]} />
          <div className="mt-4">
            <Link href={`/dis-klinikleri/${slug}`} className="inline-flex items-center gap-1 text-sm text-blue-700 hover:underline">
              <ArrowLeft className="h-4 w-4" /> {city} kliniklerine dön
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Ana içerik */}
          <div>
            <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-semibold text-blue-950">{name}</h1>
              <span className="mt-2 inline-block rounded bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
                OpenStreetMap kaynağı
              </span>

              <div className="mt-4">
                <GoogleRatingBadge clinicName={name} city={city} />
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                  <div>
                    <p className="font-medium text-blue-950">Adres</p>
                    <p className="text-sm text-slate-600">{formattedAddress}</p>
                  </div>
                </div>
                {phone ? (
                  <div className="flex items-start gap-3">
                    <Phone className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                    <div>
                      <p className="font-medium text-blue-950">Telefon</p>
                      <a href={contact.callHref!} className="text-sm text-blue-700 hover:underline">{phone}</a>
                    </div>
                  </div>
                ) : null}
                {websiteUrl ? (
                  <div className="flex items-start gap-3">
                    <Globe2 className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                    <div>
                      <p className="font-medium text-blue-950">Web sitesi</p>
                      <a href={websiteUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 hover:underline">{websiteUrl}</a>
                    </div>
                  </div>
                ) : null}
                {specialties.length ? (
                  <div className="flex items-start gap-3">
                    <Stethoscope className="mt-1 h-5 w-5 shrink-0 text-blue-700" />
                    <div>
                      <p className="font-medium text-blue-950">Uzmanlıklar</p>
                      <p className="text-sm text-slate-600">{specialties.map((s) => s.replaceAll("_", " ")).join(", ")}</p>
                    </div>
                  </div>
                ) : null}
                {tags.opening_hours ? (
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 shrink-0 text-blue-700" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    <div>
                      <p className="font-medium text-blue-950">Çalışma saatleri</p>
                      <p className="text-sm text-slate-600">{tags.opening_hours}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {contact.callHref ? (
                  <a href={contact.callHref} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
                    <Phone className="h-4 w-4" /> Ara
                  </a>
                ) : null}
                <a href={osmUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                  Haritada aç <ExternalLink className="h-4 w-4" />
                </a>
                <a href={googleSearchUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-medium text-blue-800">
                  Google&apos;da ara <ExternalLink className="h-4 w-4" />
                </a>
                {websiteUrl ? (
                  <a href={websiteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700">
                    <Globe2 className="h-4 w-4" /> Web sitesi
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-6">
              <OpenStreetMapSourceNotice />
            </div>
          </div>

          {/* Harita sidebar */}
          {latitude && longitude ? (
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-lg border border-blue-100 bg-white shadow-sm">
                <div className="border-b border-blue-100 px-4 py-3">
                  <h2 className="font-semibold text-blue-950">Konum</h2>
                </div>
                <OsmDetailMap latitude={latitude} longitude={longitude} name={name} />
                <div className="border-t border-blue-100 px-4 py-2">
                  <OpenStreetMapAttribution />
                </div>
              </div>
            </aside>
          ) : null}
        </div>

        <div className="mt-6 rounded-md border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600">
          Bu işletme DişçiBul&apos;a kayıtlı değildir. Konum ve telefon bilgileri OpenStreetMap kaydında yayınlandığı ölçüde gösterilir; aramadan önce bilgileri klinikten doğrulayın.
        </div>
      </section>
    </main>
  );
}
