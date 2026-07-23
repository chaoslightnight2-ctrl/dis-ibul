import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-team-invitation-revoke", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.clinicTeamInvitation.updateMany({
    where: { id, clinicId: access.clinic.id, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_TEAM_INVITATION_REVOKED", target: `invitation:${id}` } });
  return NextResponse.json({ id, revoked: true });
}
