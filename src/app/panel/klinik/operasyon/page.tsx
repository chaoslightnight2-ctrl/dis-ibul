import Link from "next/link";
import { ArrowLeft, CalendarCog } from "lucide-react";
import { ClinicOperationsManager } from "@/components/clinic/clinic-operations-manager";
import { getActiveClinicMembership } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const defaultHours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: dayOfWeek === 6 ? "14:00" : "18:00", isClosed: dayOfWeek === 0 }));

export default async function ClinicOperationsPage() {
  const user = await requireUser(["CLINIC_MANAGER", "DENTIST"]);
  const membership = await getActiveClinicMembership(user.id);
  if (!membership) return <main className="mx-auto max-w-3xl px-4 py-12"><p className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Operasyon bilgilerini görüntülemek için bir klinik ekibine bağlı olmanız gerekir.</p></main>;
  const [hours, closedDays, campaigns, packages, treatments] = await Promise.all([
    prisma.workingHour.findMany({ where: { clinicId: membership.clinicId, branchId: null, dentistId: null }, orderBy: { dayOfWeek: "asc" } }),
    prisma.clinicClosedDay.findMany({ where: { clinicId: membership.clinicId, branchId: null, dentistId: null, date: { gte: new Date(new Date().toISOString().slice(0, 10)) } }, orderBy: { date: "asc" }, take: 30 }),
    prisma.campaign.findMany({ where: { clinicId: membership.clinicId, isActive: true }, orderBy: { createdAt: "desc" } }),
    prisma.treatmentPackage.findMany({ where: { clinicId: membership.clinicId, isActive: true }, include: { treatment: { select: { slug: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.treatment.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const normalizedHours = hours.length === 7 ? hours.map(({ dayOfWeek, opensAt, closesAt, isClosed }) => ({ dayOfWeek, opensAt, closesAt, isClosed })) : defaultHours;

  return <main className="min-h-[70vh] bg-blue-50/30"><section className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><Link href="/panel/klinik" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" /> Klinik paneline dön</Link><div className="mt-4 flex items-center gap-3"><CalendarCog className="h-6 w-6 text-blue-700" /><div><h1 className="text-2xl font-semibold text-blue-950">Klinik operasyonu</h1><p className="mt-1 text-sm text-slate-600">Takvim kurallarını, kapalı günleri, kampanyaları ve tedavi paketlerini yönetin.</p></div></div></div></section><section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><ClinicOperationsManager initialHours={normalizedHours} appointmentDurationMinutes={membership.clinic.appointmentDurationMinutes} bookingLeadHours={membership.clinic.bookingLeadHours} bookingWindowDays={membership.clinic.bookingWindowDays} closedDays={closedDays.map((day) => ({ id: day.id, date: day.date.toISOString().slice(0, 10), reason: day.reason }))} campaigns={campaigns.map((campaign) => ({ ...campaign, startsAt: campaign.startsAt?.toISOString() ?? null, endsAt: campaign.endsAt?.toISOString() ?? null, createdAt: undefined, updatedAt: undefined }))} packages={packages.map((item) => ({ id: item.id, treatmentSlug: item.treatment?.slug ?? null, name: item.name, description: item.description, price: item.price === null ? null : Number(item.price), currency: item.currency, startsAt: item.startsAt?.toISOString() ?? null, endsAt: item.endsAt?.toISOString() ?? null, isActive: item.isActive }))} treatments={treatments} canManage={membership.role === "CLINIC_MANAGER"} /></section></main>;
}
