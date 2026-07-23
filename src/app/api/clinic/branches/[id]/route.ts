import { NextResponse } from "next/server";
import { clinicBranchSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-branch-update", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicBranchSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;
  const existing = await prisma.clinicBranch.findFirst({ where: { id, clinicId: access.clinic.id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    if (payload.data.isMain) await tx.clinicBranch.updateMany({ where: { clinicId: access.clinic.id }, data: { isMain: false } });
    await tx.clinicBranch.update({ where: { id }, data: payload.data });
    await tx.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_BRANCH_UPDATED", target: `branch:${id}` } });
  });
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-branch-archive", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const existing = await prisma.clinicBranch.findFirst({ where: { id, clinicId: access.clinic.id, isActive: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.clinicBranch.update({ where: { id }, data: { isActive: false, isMain: false } });
    if (existing.isMain) {
      const replacement = await tx.clinicBranch.findFirst({
        where: { clinicId: access.clinic.id, isActive: true, id: { not: id } },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });
      if (replacement) await tx.clinicBranch.update({ where: { id: replacement.id }, data: { isMain: true } });
    }
    await tx.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_BRANCH_ARCHIVED", target: `branch:${id}` } });
  });
  return NextResponse.json({ id, archived: true });
}
