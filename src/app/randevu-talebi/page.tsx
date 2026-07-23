import { notFound } from "next/navigation";
import { AppointmentForm } from "@/components/requests/appointment-form";
import { MedicalNotice } from "@/components/ui/notice";
import { requireUser } from "@/lib/session";
import { getPublishedClinicBySlug } from "@/services/clinics/public-clinics";

type AppointmentPageProps = {
  searchParams: Promise<{ clinic?: string; treatment?: string }>;
};

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  await requireUser(["PATIENT"]);
  const params = await searchParams;
  if (!params.clinic) notFound();
  const clinic = await getPublishedClinicBySlug(params.clinic);
  if (!clinic) notFound();
  const treatmentName = params.treatment ?? clinic.prices[0]?.treatmentName ?? clinic.treatments[0] ?? "Genel muayene";

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Randevu talebi</h1>
        <p className="mt-2 text-slate-600">{clinic.name} için talep oluşturun. Klinik talebi onaylayabilir veya alternatif saat önerebilir.</p>
        <div className="mt-6">
          <AppointmentForm clinicSlug={clinic.slug} treatmentName={treatmentName} />
        </div>
      </section>
      <aside className="space-y-4">
        <MedicalNotice />
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Acil durumda bu platformu beklemeyin; en yakın sağlık kuruluşuna veya acil hizmetlere başvurun.
        </div>
      </aside>
    </main>
  );
}
