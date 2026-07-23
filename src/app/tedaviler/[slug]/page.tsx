import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClinicCard } from "@/components/clinic/clinic-card";
import { prisma } from "@/lib/prisma";
import { getPublishedClinics } from "@/services/clinics/public-clinics";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug }, select: { name: true, description: true } });
  if (!treatment) return {};
  const title = `${treatment.name} Fiyatları ve Klinikler`;
  const description = treatment.description?.slice(0, 160) || `${treatment.name} için klinikleri, fiyat kapsamlarını ve ilk uygun randevuları karşılaştırın.`;
  return { title, description, alternates: { canonical: `/tedaviler/${slug}` } };
}

export default async function TreatmentPage({ params }: PageProps) {
  const { slug } = await params;
  const treatment = await prisma.treatment.findUnique({ where: { slug }, select: { name: true, description: true, riskWarning: true, patientInfoText: true } });
  if (!treatment) notFound();
  const clinics = (await getPublishedClinics()).filter((clinic) => clinic.prices.some((price) => price.treatmentSlug === slug) || clinic.treatments.includes(treatment.name));
  return <main className="min-h-[70vh] bg-blue-50/30"><header className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><h1 className="text-3xl font-semibold text-blue-950">{treatment.name}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{treatment.description || treatment.patientInfoText || "Tedavi seçeneklerini ve klinik fiyatlarını karşılaştırın."}</p>{treatment.riskWarning ? <p className="mt-3 max-w-3xl text-xs leading-5 text-amber-800">Tıbbi not: {treatment.riskWarning}</p> : null}</div></header><section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:px-8">{clinics.length ? clinics.map((clinic) => <ClinicCard key={clinic.slug} clinic={clinic} />) : <p className="rounded-lg border border-dashed border-blue-200 bg-white p-8 text-center text-sm text-slate-500">Bu tedavi için yayınlanmış klinik fiyatı henüz bulunmuyor.</p>}</section></main>;
}
