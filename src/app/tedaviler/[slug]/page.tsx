import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { brand } from "@/config/brand";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!treatment) return {};
  const title = `${treatment.name} Fiyatları ve Klinikler | ${brand.name}`;
  const description = treatment.description?.slice(0, 160) || `${treatment.name} için klinikleri karşılaştırın, fiyat ve iletişim bilgilerini inceleyin.`;
  return { title, description, alternates: { canonical: `/tedaviler/${slug}` }, openGraph: { title, description, type: "website", siteName: brand.name } };
}

export default async function TreatmentPage({ params }: PageProps) {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug }, select: { name: true, description: true, riskWarning: true, patientInfoText: true, pricingUnit: true, averageSessions: true, estimatedDuration: true } });
  if (!treatment) notFound();

  return (
    <main className="min-h-[70vh] bg-blue-50/30">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs items={[
            { label: "Tedaviler", href: "/tedaviler" },
            { label: treatment.name },
          ]} />
          <h1 className="text-3xl font-semibold text-blue-950">{treatment.name}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {treatment.description || treatment.patientInfoText || `${treatment.name} tedavisi hakkında bilgi alın, klinikleri karşılaştırın.`}
          </p>
          {/* Treatment meta */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            {treatment.pricingUnit ? (
              <span className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-800">
                Fiyatlandırma: {treatment.pricingUnit}
              </span>
            ) : null}
            {treatment.averageSessions ? (
              <span className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-800">
                Ortalama seans: {treatment.averageSessions}
              </span>
            ) : null}
            {treatment.estimatedDuration ? (
              <span className="rounded-md bg-blue-50 px-3 py-1.5 text-blue-800">
                Tahmini süre: {treatment.estimatedDuration}
              </span>
            ) : null}
          </div>
          {treatment.riskWarning ? (
            <p className="mt-3 max-w-3xl text-xs leading-5 text-amber-800">
              Tıbbi not: {treatment.riskWarning}
            </p>
          ) : null}
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Patient info */}
        {treatment.patientInfoText ? (
          <div className="mb-6 rounded-lg border border-blue-100 bg-white p-6">
            <h2 className="text-lg font-semibold text-blue-950">Hasta bilgilendirme</h2>
            <p className="mt-2 text-sm leading-7 text-slate-700">{treatment.patientInfoText}</p>
          </div>
        ) : null}

        {/* No registered clinics notice + CTA to search */}
        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 text-center shadow-sm">
          <Search className="mx-auto h-8 w-8 text-blue-400" />
          <h2 className="mt-3 text-xl font-semibold text-blue-950">{treatment.name} için klinik ara</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
            Bu tedaviyi yapan klinikleri bulmak için arama sayfasını kullanabilir, şehir seçerek sonuçları daraltabilirsiniz.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/arama?treatment=${encodeURIComponent(treatment.name)}`}
              className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              <Search className="h-4 w-4" /> Klinik ara
            </Link>
            <Link
              href="/tedaviler"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowRight className="h-4 w-4" /> Diğer tedaviler
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
