import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { clinicTeamInvitationSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestOrigin } from "@/lib/request-url";
import { isEmailDeliveryEnabled, sendActionEmail } from "@/services/email/provider";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-team-invitation", 8);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicTeamInvitationSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  if (payload.data.email === access.user.email.toLowerCase()) {
    return NextResponse.json({ error: "CANNOT_INVITE_SELF" }, { status: 409 });
  }

  const invitee = await prisma.user.findFirst({
    where: { email: { equals: payload.data.email, mode: "insensitive" } },
    select: { id: true, name: true },
  });
  if (invitee) {
    const membership = await prisma.clinicTeamMember.findUnique({
      where: { clinicId_userId: { clinicId: access.clinic.id, userId: invitee.id } },
      select: { id: true },
    });
    if (membership) return NextResponse.json({ error: "ALREADY_A_MEMBER" }, { status: 409 });
  } else if (!isEmailDeliveryEnabled()) {
    return NextResponse.json({ error: "EMAIL_DELIVERY_UNAVAILABLE" }, { status: 503 });
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  const invitation = await prisma.$transaction(async (tx) => {
    await tx.clinicTeamInvitation.updateMany({
      where: { clinicId: access.clinic.id, email: payload.data.email, acceptedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    const created = await tx.clinicTeamInvitation.create({
      data: {
        clinicId: access.clinic.id,
        email: payload.data.email,
        role: payload.data.role,
        tokenHash,
        invitedById: access.user.id,
        expiresAt,
      },
    });
    if (invitee) {
      await tx.notification.create({
        data: {
          userId: invitee.id,
          type: "CLINIC_INVITATION",
          title: `${access.clinic.name} ekibine davet edildiniz`,
          body: "Davet 72 saat geçerlidir.",
          href: `/klinik-daveti/${token}`,
        },
      });
    }
    await tx.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "CLINIC_TEAM_INVITED",
        target: `clinic:${access.clinic.id}`,
        metadata: { email: payload.data.email, role: payload.data.role },
      },
    });
    return created;
  });

  const invitationUrl = `${getRequestOrigin(request)}/klinik-daveti/${token}`;
  if (isEmailDeliveryEnabled()) {
    try {
      await sendActionEmail({
        userId: access.user.id,
        recipient: payload.data.email,
        recipientName: invitee?.name ?? payload.data.email,
        kind: "CLINIC_INVITATION",
        actionUrl: invitationUrl,
      });
    } catch {
      await prisma.clinicTeamInvitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
      return NextResponse.json({ error: "INVITATION_EMAIL_FAILED" }, { status: 502 });
    }
  }

  return NextResponse.json({
    id: invitation.id,
    expiresAt: invitation.expiresAt,
    ...(process.env.NODE_ENV === "production" ? {} : { invitationUrl }),
  }, { status: 201 });
}
