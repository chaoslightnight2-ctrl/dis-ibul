import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-closed-day-delete", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.clinicClosedDay.deleteMany({ where: { id, clinicId: access.clinic.id } });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_CLOSED_DAY_DELETED", target: `closed-day:${id}` } });
  return NextResponse.json({ id, deleted: true });
}
