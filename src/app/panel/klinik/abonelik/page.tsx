import { ArrowLeft, LockKeyhole, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ClinicBilling } from "@/components/billing/clinic-billing";
import { getActiveClinicMembership } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isIyzicoConfigured } from "@/services/billing/iyzico";

type PageProps = {
  searchParams: Promise<{ durum?: string | string[] }>;
};

const notices: Record<string, { title: string; detail: string; error?: boolean }> = {
  aktif: { title: "Aboneliğiniz etkinleştirildi", detail: "Plan özellikleri klinik hesabınıza tanımlandı." },
  "odeme-hatasi": { title: "Ödeme tamamlanamadı", detail: "Kartınızdan tahsilat yapılmadıysa bilgilerinizi kontrol edip yeniden deneyin.", error: true },
};

export default async function ClinicBillingPage({ searchParams }: PageProps) {
  const user = await requireUser(["CLINIC_MANAGER"]);
  const membership = await getActiveClinicMembership(user.id);

  if (!membership || membership.role !== "CLINIC_MANAGER") {
    return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-2xl font-semibold text-blue-950">Bağlı klinik bulunamadı</h1><p className="mt-2 text-sm text-slate-600">Abonelik yönetimi için hesabınızın bir kliniğe bağlı olması gerekir.</p></main>;
  }

  const [plans, activeSubscription] = await Promise.all([
    prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: [{ displayOrder: "asc" }, { monthlyPrice: "asc" }] }),
    prisma.subscription.findFirst({
      where: { clinicId: membership.clinic.id, status: { in: ["ACTIVE", "PENDING", "UNPAID"] } },
      include: { plan: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const query = await searchParams;
  const noticeKey = typeof query.durum === "string" ? query.durum : "";
  const notice = notices[noticeKey];

  return (
    <main className="min-h-[75vh] bg-blue-50/30 pb-12">
      <header className="border-b border-blue-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/panel/klinik" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"><ArrowLeft className="h-4 w-4" /> Klinik paneli</Link>
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><p className="text-sm font-semibold text-emerald-700">{membership.clinic.name}</p><h1 className="mt-2 text-3xl font-semibold text-blue-950">Abonelik ve planlar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Hasta talepleri, profil görünürlüğü ve ekip özellikleri için ihtiyacınıza uygun planı seçin.</p></div>
            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-700" /> Güvenli ödeme</span><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-blue-700" /> Kart verisi saklanmaz</span><span className="inline-flex items-center gap-2"><ReceiptText className="h-4 w-4 text-blue-700" /> Aylık faturalama</span></div>
          </div>
        </div>
      </header>

      {notice ? <div className={`border-b px-4 py-4 text-center text-sm font-medium ${notice.error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}><strong>{notice.title}.</strong> {notice.detail}</div> : null}

      <div className="py-8">
        <ClinicBilling
          billingEnabled={isIyzicoConfigured()}
          plans={plans.map((plan) => ({
            slug: plan.slug,
            name: plan.name,
            description: plan.description,
            monthlyPrice: Number(plan.monthlyPrice),
            currency: plan.currency,
            features: plan.features,
            trialDays: plan.trialDays,
            isPopular: plan.isPopular,
          }))}
          activeSubscription={activeSubscription ? {
            planSlug: activeSubscription.plan.slug,
            planName: activeSubscription.plan.name,
            provider: activeSubscription.provider,
            status: activeSubscription.status,
            startsAt: activeSubscription.startsAt.toISOString(),
            endsAt: activeSubscription.endsAt?.toISOString() ?? null,
          } : null}
        />
      </div>
    </main>
  );
}
