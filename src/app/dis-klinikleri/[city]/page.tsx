import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OsmClinicCard } from "@/components/clinic/osm-clinic-card";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import type { OpenStreetMapClinic } from "@/domain/types";
import { brand } from "@/config/brand";
import { isTurkeyCity } from "@/config/turkey-cities";
import { searchOsmClinicIndex } from "@/services/osm/clinic-index";

type PageProps = { params: Promise<{ city: string }> };

function toTitleCase(str: string) {
  return str.charAt(0).toLocaleUpperCase("tr-TR") + str.slice(1);
}

function dedupeClinics(clinics: OpenStreetMapClinic[]) {
  const unique = new Map<string, OpenStreetMapClinic>();
  for (const clinic of clinics) unique.set(`${clinic.osmType}/${clinic.osmId}`, clinic);
  return [...unique.values()];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = toTitleCase(slug);
  if (!isTurkeyCity(city)) return {};
  const title = `${city} Diş Klinikleri | ${brand.name}`;
  const description = `${city} diş kliniklerini keşfedin. Konum ve iletişim bilgilerini inceleyin.`;
  return { title, description, alternates: { canonical: `/dis-klinikleri/${slug}` }, openGraph: { title, description, type: "website", siteName: brand.name } };
}

export default async function CityClinicsPage({ params }: PageProps) {
  const { city: slug } = await params;
  const city = toTitleCase(slug);
  if (!isTurkeyCity(city)) notFound();

  let osmClinics: OpenStreetMapClinic[] = [];
  try {
    osmClinics = dedupeClinics(await searchOsmClinicIndex({ city, source: "internet" }));
  } catch {
    // Database unavailable
  }

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: city, href: `/dis-klinikleri/${slug}` }]} />
          <h1 className="text-3xl font-semibold text-blue-950">{city} diş klinikleri</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {osmClinics.length > 0
              ? `OpenStreetMap üzerinde ${city} bölgesinde bulunan ${osmClinics.length} diş kliniği.`
              : `${city} bölgesindeki diş kliniklerini keşfedin.`}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {osmClinics.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-blue-950">{osmClinics.length}</span> klinik bulundu
              </p>
              <div className="flex items-center gap-2">
                <OpenStreetMapAttribution />
                <Link
                  href={`/arama?city=${encodeURIComponent(city)}`}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Detaylı ara <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="grid gap-4" id="osm-results">
              {osmClinics.map((clinic) => {
                const clinicSlug = `${clinic.osmType}-${clinic.osmId}`;
                return (
                  <div key={clinicSlug} id={`clinic-${clinicSlug}`}>
                    <OsmClinicCard clinic={clinic} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-blue-950">Henüz klinik bulunamadı</h2>
            <p className="mt-2 text-sm text-slate-600">
              {city} bölgesinde OpenStreetMap üzerinde kayıtlı diş kliniği bulunamadı. Farklı bir yazım deneyin veya{" "}
              <Link href="/arama" className="text-blue-700 hover:underline">tüm Türkiye&apos;de arayın</Link>.
            </p>
          </div>
        )}

        <div className="mt-6">
          <OpenStreetMapSourceNotice />
        </div>
      </section>
    </main>
  );
}
