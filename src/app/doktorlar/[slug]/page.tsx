import { notFound } from "next/navigation";
import { findDentistBySlug } from "@/data/clinics";

type DentistPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DentistPage({ params }: DentistPageProps) {
  const { slug } = await params;
  const result = findDentistBySlug(slug);
  if (!result) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-950">{result.fullName}</h1>
            <p className="mt-1 text-slate-600">{result.title}</p>
          </div>
          {result.verified ? <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">Doğrulanmış hekim</span> : null}
        </div>
        <p className="mt-6 leading-7 text-slate-700">{result.about}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Uzmanlıklar</dt>
            <dd className="mt-1 font-medium">{result.specialties.join(", ")}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Çalıştığı klinik</dt>
            <dd className="mt-1 font-medium">{result.clinic.name}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Diller</dt>
            <dd className="mt-1 font-medium">{result.languages.join(", ")}</dd>
          </div>
          <div className="rounded-md bg-slate-50 p-4">
            <dt className="text-sm text-slate-500">Çalıştığı kliniğin Google puanı</dt>
            <dd className="mt-1 font-medium">{result.clinic.google.rating ? `${result.clinic.google.rating} / 5` : "Google puanı şu anda alınamıyor"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
