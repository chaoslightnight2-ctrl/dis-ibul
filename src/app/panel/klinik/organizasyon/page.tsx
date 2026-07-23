import Link from "next/link";
import { ArrowLeft, Network } from "lucide-react";
import { ClinicOrganizationManager } from "@/components/clinic/clinic-organization-manager";
import { getActiveClinicMembership } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ClinicOrganizationPage() {
  const user = await requireUser(["CLINIC_MANAGER", "DENTIST"]);
  const membership = await getActiveClinicMembership(user.id);
  if (!membership) return <main className="mx-auto max-w-3xl px-4 py-12"><p className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Organizasyonu görüntülemek için bir klinik ekibine bağlı olmanız gerekir.</p></main>;

  const [branches, dentists, members, invitations] = await Promise.all([
    prisma.clinicBranch.findMany({ where: { clinicId: membership.clinicId, isActive: true }, orderBy: [{ isMain: "desc" }, { createdAt: "asc" }] }),
    prisma.dentist.findMany({ where: { clinicId: membership.clinicId, isActive: true }, orderBy: { fullName: "asc" } }),
    prisma.clinicTeamMember.findMany({ where: { clinicId: membership.clinicId }, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.clinicTeamInvitation.findMany({ where: { clinicId: membership.clinicId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } }),
  ]);

  return <main className="min-h-[70vh] bg-blue-50/30"><section className="border-b border-blue-100 bg-white"><div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8"><Link href="/panel/klinik" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700"><ArrowLeft className="h-4 w-4" /> Klinik paneline dön</Link><div className="mt-4 flex items-center gap-3"><Network className="h-6 w-6 text-blue-700" /><div><h1 className="text-2xl font-semibold text-blue-950">{membership.clinic.name} organizasyonu</h1><p className="mt-1 text-sm text-slate-600">Şubeleri, diş hekimlerini ve ekip erişimlerini tek yerden yönetin.</p></div></div></div></section><section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><ClinicOrganizationManager branches={branches} dentists={dentists} members={members} invitations={invitations.map((invitation) => ({ id: invitation.id, email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt.toISOString() }))} canManage={membership.role === "CLINIC_MANAGER"} currentUserId={user.id} /></section></main>;
}
