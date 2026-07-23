import { NextResponse } from "next/server";
import { clinicTreatmentPackageSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-package-update", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicTreatmentPackageSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;
  const existing = await prisma.treatmentPackage.findFirst({ where: { id, clinicId: access.clinic.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const treatment = payload.data.treatmentSlug
    ? await prisma.treatment.findUnique({ where: { slug: payload.data.treatmentSlug }, select: { id: true } })
    : null;
  if (payload.data.treatmentSlug && !treatment) return NextResponse.json({ error: "TREATMENT_NOT_FOUND" }, { status: 404 });
  await prisma.treatmentPackage.update({
    where: { id },
    data: {
      treatmentId: treatment?.id ?? null,
      name: payload.data.name,
      description: payload.data.description,
      price: payload.data.price,
      currency: payload.data.currency,
      startsAt: payload.data.startsAt ? new Date(payload.data.startsAt) : null,
      endsAt: payload.data.endsAt ? new Date(payload.data.endsAt) : null,
      isActive: payload.data.isActive,
    },
  });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_PACKAGE_UPDATED", target: `package:${id}` } });
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-package-archive", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.treatmentPackage.updateMany({ where: { id, clinicId: access.clinic.id }, data: { isActive: false } });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ id, archived: true });
}
