import { NextResponse } from "next/server";
import { clinicDentistSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-dentist-update", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicDentistSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;
  const existing = await prisma.dentist.findFirst({ where: { id, clinicId: access.clinic.id, isActive: true }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.$transaction([
    prisma.dentist.update({ where: { id }, data: { ...payload.data, verificationStatus: "PENDING_SUBMISSION" } }),
    prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_DENTIST_UPDATED", target: `dentist:${id}` } }),
  ]);
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-dentist-archive", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.dentist.updateMany({ where: { id, clinicId: access.clinic.id, isActive: true }, data: { isActive: false } });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_DENTIST_ARCHIVED", target: `dentist:${id}` } });
  return NextResponse.json({ id, archived: true });
}
