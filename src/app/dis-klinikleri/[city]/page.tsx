import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";
import { getPublishedClinics } from "@/services/clinics/public-clinics";

type PageProps = { params: Promise<{ city: string }> };

async function resolveCity(slug: string) {
  const cities = await prisma.clinic.findMany({ where: { isPublished: true }, distinct: ["city"], select: { city: true } });
  return cities.find((item) => toSlug(item.city) === slug)?.city ?? null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) return {};
  const title = `${city} Diş Klinikleri ve Fiyatları`;
  const description = `${city} diş kliniklerini ilk muayene ücreti, tedavi fiyatı, klinik olanakları ve Google bilgileriyle karşılaştırın.`;
  return { title, description, alternates: { canonical: `/dis-klinikleri/${slug}` } };
}

export default async function CityClinicsPage({ params }: PageProps) {
  const { city: slug } = await params;
  const city = await resolveCity(slug);
  if (!city) notFound();
  const clinics = (await getPublishedClinics()).filter((clinic) => clinic.city === city);
  return <main className="min-h-[70vh] bg-blue-50/30"><header className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold text-blue-950">{city} diş klinikleri</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Yayınlanmış klinikleri ücret, uygunluk, olanak ve doğrulanmış işletme bilgileriyle inceleyin.</p></div></header><section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:px-8">{clinics.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />)}</section></main>;
}
