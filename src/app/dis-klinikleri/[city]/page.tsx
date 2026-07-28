import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { DirectoryClinicCard } from "@/components/clinic/directory-clinic-card";
import { OsmClinicCard } from "@/components/clinic/osm-clinic-card";
import { OpenStreetMapAttribution } from "@/components/osm/openstreetmap-attribution";
import { OpenStreetMapSourceNotice } from "@/components/ui/notice";
import type { OpenStreetMapClinic, PublicDirectoryClinic } from "@/domain/types";
import { brand } from "@/config/brand";
import { isTurkeyCity } from "@/config/turkey-cities";
import { countPublicClinicDirectory, searchPublicClinicDirectory } from "@/services/directory/clinic-directory";
import { countOsmClinicIndex, searchOsmClinicIndex } from "@/services/osm/clinic-index";

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
  let directoryClinics: PublicDirectoryClinic[] = [];
  let totalClinics = 0;
  try {
    const filters = { city, source: "internet" as const };
    const [indexed, directory, osmTotal, directoryTotal] = await Promise.all([
      searchOsmClinicIndex(filters),
      searchPublicClinicDirectory(filters),
      countOsmClinicIndex(filters),
      countPublicClinicDirectory(filters),
    ]);
    osmClinics = dedupeClinics(indexed);
    directoryClinics = directory;
    totalClinics = osmTotal + directoryTotal;
  } catch {
    // Database unavailable.
  }

  const shownClinics = osmClinics.length + directoryClinics.length;

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: city, href: `/dis-klinikleri/${slug}` }]} />
          <h1 className="text-3xl font-semibold text-blue-950">{city} diş klinikleri</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {totalClinics > 0
              ? `${city} bölgesinde veritabanında bulunan ${totalClinics} diş kliniği.`
              : `${city} bölgesindeki diş kliniklerini keşfedin.`}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {totalClinics > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-blue-950">{totalClinics}</span> klinik bulundu
                {shownClinics < totalClinics ? <span> · İlk {shownClinics} kayıt gösteriliyor</span> : null}
              </p>
              <div className="flex items-center gap-2">
                {osmClinics.length > 0 ? <OpenStreetMapAttribution /> : null}
                <Link
                  href={`/arama?city=${encodeURIComponent(city)}`}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-700 px-3 py-1.5 text-sm font-medium text-white"
                >
                  Detaylı ara <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {directoryClinics.length ? (
              <section className="mb-6 space-y-4">
                <div className="border-b border-cyan-100 pb-3">
                  <h2 className="text-xl font-semibold text-blue-950">Klinik dizini</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Resmi ve açık veri kaynaklarından alınan klinik kayıtları. Kaynak her kartta açıkça gösterilir.
                  </p>
                </div>
                <div className="grid gap-4" id="directory-results">
                  {directoryClinics.map((clinic) => (
                    <DirectoryClinicCard key={clinic.sourceRef} clinic={clinic} />
                  ))}
                </div>
              </section>
            ) : null}

            {osmClinics.length ? (
              <section className="space-y-4">
                <div className="border-b border-blue-100 pb-3">
                  <h2 className="text-xl font-semibold text-blue-950">Açık kaynak harita verisi</h2>
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
              </section>
            ) : null}
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center">
            <h2 className="font-semibold text-blue-950">Henüz klinik bulunamadı</h2>
            <p className="mt-2 text-sm text-slate-600">
              {city} bölgesinde veritabanında kayıtlı diş kliniği bulunamadı. Farklı bir yazım deneyin veya{" "}
              <Link href="/arama" className="text-blue-700 hover:underline">tüm Türkiye&apos;de arayın</Link>.
            </p>
          </div>
        )}

        {totalClinics > 0 ? (
          <div className="mt-6">
            <OpenStreetMapSourceNotice />
          </div>
        ) : null}
      </section>
    </main>
  );
}
