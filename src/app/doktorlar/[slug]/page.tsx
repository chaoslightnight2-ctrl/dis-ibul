import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type DentistPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: DentistPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dentist = await prisma.dentist.findFirst({ where: { slug, isActive: true, verificationStatus: "VERIFIED", clinic: { isPublished: true } }, select: { fullName: true, title: true, about: true, photoUrl: true, clinic: { select: { city: true } } } });
  if (!dentist) return {};
  const title = `${dentist.fullName} | ${dentist.title}`;
  const description = dentist.about?.slice(0, 160) || `${dentist.fullName} hakkında eğitim, deneyim, uzmanlık ve çalıştığı klinik bilgileri.`;
  return { title, description, alternates: { canonical: `/doktorlar/${slug}` }, openGraph: { title, description, images: dentist.photoUrl ? [dentist.photoUrl] : ["/og.png"] } };
}

export default async function DentistPage({ params }: DentistPageProps) {
  const { slug } = await params;
  const result = await prisma.dentist.findFirst({
    where: { slug, verificationStatus: "VERIFIED", clinic: { isPublished: true } },
    include: {
      clinic: { include: { googleConnection: true } },
      specialties: { include: { specialty: true } },
      education: { orderBy: { year: "desc" } },
      certificates: { orderBy: { year: "desc" } },
    },
  });
  if (!result) notFound();
  const googleRating = result.clinic?.googleConnection?.googleRating;
  const structuredData = { "@context": "https://schema.org", "@type": "Dentist", name: result.fullName, jobTitle: result.title, description: result.about, alumniOf: result.university, knowsLanguage: result.languages, worksFor: result.clinic ? { "@type": "Dentist", name: result.clinic.name, url: `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/klinikler/${result.clinic.slug}` } : undefined };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }} />
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{result.fullName}</h1>
            <p className="mt-1 text-slate-600">{result.title}</p>
          </div>
          <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış hekim</span>
        </div>
        <p className="mt-6 leading-7 text-slate-700">{result.about}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Uzmanlıklar</dt>
            <dd className="mt-1 font-medium">{result.specialties.map((item) => item.specialty.name).join(", ") || "Belirtilmedi"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Çalıştığı klinik</dt>
            <dd className="mt-1 font-medium">{result.clinic ? <Link href={`/klinikler/${result.clinic.slug}`} className="text-blue-700">{result.clinic.name}</Link> : "Belirtilmedi"}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Diller</dt>
            <dd className="mt-1 font-medium">{result.languages.join(", ")}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Çalıştığı kliniğin Google puanı</dt>
            <dd className="mt-1 font-medium">{googleRating ? `${Number(googleRating).toFixed(1)} / 5` : "Google puanı şu anda alınamıyor"}</dd>
          </div>
        </dl>
        {result.education.length || result.certificates.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {result.education.length ? <section className="rounded-md border border-slate-200 p-4"><h2 className="font-semibold">Eğitim</h2><ul className="mt-3 grid gap-2 text-sm text-slate-700">{result.education.map((item) => <li key={item.id}>{item.school}{item.degree ? ` · ${item.degree}` : ""}{item.year ? ` · ${item.year}` : ""}</li>)}</ul></section> : null}
            {result.certificates.length ? <section className="rounded-md border border-slate-200 p-4"><h2 className="font-semibold">Sertifikalar</h2><ul className="mt-3 grid gap-2 text-sm text-slate-700">{result.certificates.map((item) => <li key={item.id}>{item.name}{item.issuer ? ` · ${item.issuer}` : ""}{item.year ? ` · ${item.year}` : ""}</li>)}</ul></section> : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
