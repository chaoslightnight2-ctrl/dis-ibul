import { notFound } from "next/navigation";
import { QuoteForm } from "@/components/requests/quote-form";
import { MedicalNotice } from "@/components/ui/notice";
import { requireUser } from "@/lib/session";
import { getPublishedClinics } from "@/services/clinics/public-clinics";

type QuotePageProps = {
  searchParams: Promise<{ clinics?: string; treatment?: string; city?: string }>;
};

export default async function QuotePage({ searchParams }: QuotePageProps) {
  await requireUser(["PATIENT"]);
  const params = await searchParams;
  const clinics = await getPublishedClinics();
  const requestedSlugs = params.clinics?.split(",").filter(Boolean).slice(0, 4) ?? [];
  const selectedClinics = clinics.filter((clinic) => requestedSlugs.includes(clinic.slug));
  if (!requestedSlugs.length || selectedClinics.length !== requestedSlugs.length) notFound();
  const clinicSlugs = selectedClinics.map((clinic) => clinic.slug);
  const treatmentName = params.treatment ?? selectedClinics[0].prices[0]?.treatmentName ?? selectedClinics[0].treatments[0] ?? "Genel muayene";
  const city = params.city ?? selectedClinics[0].city;

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Fiyat teklifi talebi</h1>
        <p className="mt-2 text-slate-600">Seçilen klinikler: {selectedClinics.map((clinic) => clinic.name).join(", ")}</p>
        <div className="mt-6">
          <QuoteForm clinicSlugs={clinicSlugs} treatmentName={treatmentName} city={city} />
        </div>
      </section>
      <aside className="space-y-4">
        <MedicalNotice />
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Teklifler klinikler arasında paylaşılmaz. Her klinik yalnızca kendisine gönderilen talebi ve kendi cevabını görür.
        </div>
      </aside>
    </main>
  );
}
