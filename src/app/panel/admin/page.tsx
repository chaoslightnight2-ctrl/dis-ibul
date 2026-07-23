import { AlertTriangle, Building2, CircleDollarSign, FileClock, ShieldCheck, UsersRound } from "lucide-react";
import { ClinicApplicationActions } from "@/components/admin/clinic-application-actions";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AdminPanelPage() {
  await requireUser(["MODERATOR", "SUPER_ADMIN"]);
  const [userCount, clinicCount, pendingApplications, googleErrors, activePrices, openReports] = await Promise.all([
    prisma.user.count(),
    prisma.clinic.count(),
    prisma.clinicApplication.findMany({
      where: { status: { in: ["PENDING_SUBMISSION", "IN_REVIEW", "ADDITIONAL_DOCUMENT_REQUIRED"] } },
      include: { clinic: { select: { slug: true } } },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
    prisma.googlePlaceConnection.count({ where: { googleSyncStatus: { in: ["FAILED", "RATE_LIMITED"] } } }),
    prisma.treatmentPrice.count({ where: { moderationStatus: "APPROVED" } }),
    prisma.report.count({ where: { status: { in: ["DRAFT", "PENDING"] } } }),
  ]);

  const metrics = [
    { label: "Toplam kullanıcı", value: userCount, icon: UsersRound },
    { label: "Toplam klinik", value: clinicCount, icon: Building2 },
    { label: "Bekleyen başvuru", value: pendingApplications.length, icon: FileClock },
    { label: "Google bağlantı hatası", value: googleErrors, icon: AlertTriangle },
    { label: "Aktif fiyat kaydı", value: activePrices, icon: CircleDollarSign },
    { label: "Açık bildirim", value: openReports, icon: ShieldCheck },
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold text-blue-700">Yetkili yönetim alanı</p>
      <h1 className="mt-2 text-3xl font-semibold text-blue-950">Moderasyon ve operasyon</h1>
      <p className="mt-2 text-sm text-slate-600">Başvurular, fiyat kayıtları ve entegrasyon sorunları gerçek sistem verilerinden izlenir.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold text-blue-950">{value}</p></div><Icon className="h-5 w-5 text-blue-700" /></div></div>)}
      </div>
      <section className="mt-8">
        <h2 className="text-xl font-semibold text-blue-950">Klinik doğrulama kuyruğu</h2>
        {pendingApplications.length ? <div className="mt-4 overflow-x-auto rounded-lg border border-blue-100 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b border-blue-100 bg-blue-50/60 text-xs text-slate-500"><tr><th className="px-4 py-3">Klinik</th><th className="px-4 py-3">Yetkili</th><th className="px-4 py-3">Konum</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3">Başvuru</th><th className="px-4 py-3">İşlem</th></tr></thead><tbody className="divide-y divide-slate-100">{pendingApplications.map((application) => <tr key={application.id} className="align-top"><td className="px-4 py-3 font-medium text-slate-950">{application.clinicName}</td><td className="px-4 py-3 text-slate-700">{application.ownerName}</td><td className="px-4 py-3 text-slate-600">{application.city}, {application.district}</td><td className="px-4 py-3"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">{application.status}</span></td><td className="px-4 py-3 text-slate-500">{formatDate(application.createdAt.toISOString())}</td><td className="px-4 py-3"><ClinicApplicationActions applicationId={application.id} /></td></tr>)}</tbody></table></div> : <div className="mt-4 rounded-lg border border-dashed border-blue-200 bg-blue-50/30 p-6 text-center text-sm text-slate-500">Bekleyen klinik başvurusu yok.</div>}
      </section>
    </main>
  );
}
