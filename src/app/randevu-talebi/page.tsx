import { AppointmentForm } from "@/components/requests/appointment-form";
import { MedicalNotice } from "@/components/ui/notice";
import { findClinicBySlug } from "@/data/clinics";

type AppointmentPageProps = {
  searchParams: Promise<{ clinic?: string; treatment?: string }>;
};

export default async function AppointmentPage({ searchParams }: AppointmentPageProps) {
  const params = await searchParams;
  const clinic = findClinicBySlug(params.clinic ?? "") ?? findClinicBySlug("mavi-gulus-klinigi");
  const treatmentName = params.treatment ?? clinic?.prices[0]?.treatmentName ?? "Genel muayene";

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
      <section>
        <h1 className="text-3xl font-semibold text-slate-950">Randevu talebi</h1>
        <p className="mt-2 text-slate-600">{clinic?.name} için talep oluşturun. Klinik talebi onaylayabilir veya alternatif saat önerebilir.</p>
        <div className="mt-6">
          <AppointmentForm clinicSlug={clinic?.slug ?? "mavi-gulus-klinigi"} treatmentName={treatmentName} />
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
