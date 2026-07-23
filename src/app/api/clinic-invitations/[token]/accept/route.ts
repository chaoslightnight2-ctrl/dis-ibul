import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const blocked = await guardMutation(request, "clinic-invitation-accept", 6);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { token } = await context.params;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invitation = await prisma.clinicTeamInvitation.findUnique({
    where: { tokenHash },
    include: { clinic: { select: { id: true, name: true } } },
  });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) {
    return NextResponse.json({ error: "INVITATION_INVALID" }, { status: 410 });
  }
  if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
    return NextResponse.json({ error: "EMAIL_MISMATCH" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    const claimed = await tx.clinicTeamInvitation.updateMany({
      where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { acceptedAt: new Date(), acceptedById: user.id },
    });
    if (!claimed.count) throw new Error("INVITATION_ALREADY_CLAIMED");
    await tx.clinicTeamMember.upsert({
      where: { clinicId_userId: { clinicId: invitation.clinicId, userId: user.id } },
      update: { role: invitation.role },
      create: { clinicId: invitation.clinicId, userId: user.id, role: invitation.role },
    });
    const managerMembership = await tx.clinicTeamMember.findFirst({ where: { userId: user.id, role: "CLINIC_MANAGER" }, select: { id: true } });
    if (user.role !== "MODERATOR" && user.role !== "SUPER_ADMIN") {
      await tx.user.update({ where: { id: user.id }, data: { role: managerMembership ? "CLINIC_MANAGER" : "DENTIST" } });
    }
    await tx.notification.create({
      data: {
        userId: invitation.invitedById,
        type: "CLINIC_INVITATION_ACCEPTED",
        title: `${user.name} ekip davetini kabul etti`,
        body: `${invitation.clinic.name} ekibine katıldı.`,
        href: "/panel/klinik/organizasyon",
      },
    });
    await tx.auditLog.create({ data: { actorId: user.id, action: "CLINIC_TEAM_INVITATION_ACCEPTED", target: `invitation:${invitation.id}` } });
  });
  const response = NextResponse.json({ clinicName: invitation.clinic.name, redirectTo: "/panel/klinik" });
  response.cookies.set(ACTIVE_CLINIC_COOKIE, invitation.clinicId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
