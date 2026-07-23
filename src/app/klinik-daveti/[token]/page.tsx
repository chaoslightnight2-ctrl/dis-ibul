import { createHash } from "node:crypto";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Clock3, ShieldCheck } from "lucide-react";
import { ClinicInvitationAction } from "@/components/clinic/clinic-invitation-action";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export default async function ClinicInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/auth/giris?next=${encodeURIComponent(`/klinik-daveti/${token}`)}`);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.clinicTeamInvitation.findUnique({
    where: { tokenHash },
    include: { clinic: { select: { name: true, city: true, district: true } } },
  });
  const invalid = !invitation || Boolean(invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date());

  return <main className="min-h-[70vh] bg-blue-50/30 px-4 py-12"><section className="mx-auto max-w-xl rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">{invalid ? <><Clock3 className="h-7 w-7 text-amber-600" /><h1 className="mt-4 text-2xl font-semibold text-blue-950">Davet artık geçerli değil</h1><p className="mt-2 text-sm leading-6 text-slate-600">Davet kullanılmış, iptal edilmiş veya 72 saatlik süresi dolmuş olabilir. Klinik yöneticisinden yeni davet isteyin.</p><Link href={user.role === "PATIENT" ? "/panel/hasta" : "/panel/klinik"} className="mt-5 inline-flex text-sm font-semibold text-blue-700">Hesabıma dön</Link></> : <><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-blue-100 text-blue-700"><Building2 className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-blue-700">Klinik ekibi daveti</p><h1 className="mt-1 text-2xl font-semibold text-blue-950">{invitation.clinic.name}</h1><p className="mt-1 text-sm text-slate-500">{invitation.clinic.city}, {invitation.clinic.district}</p></div></div><div className="mt-6 border-y border-blue-100 py-5"><dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-slate-500">Davet edilen hesap</dt><dd className="mt-1 font-medium text-slate-950">{invitation.email}</dd></div><div><dt className="text-slate-500">Yetki</dt><dd className="mt-1 font-medium text-slate-950">{invitation.role === "CLINIC_MANAGER" ? "Klinik yöneticisi" : "Diş hekimi"}</dd></div></dl></div><p className="mt-5 flex gap-2 text-sm leading-6 text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" /> Kabul ettiğinizde yalnızca bu kliniğin yönetim alanlarına, rolünüzün izin verdiği ölçüde erişirsiniz.</p><div className="mt-6"><ClinicInvitationAction token={token} /></div></>}</section></main>;
}
