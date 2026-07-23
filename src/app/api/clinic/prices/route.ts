import { NextResponse } from "next/server";
import { clinicPriceSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-price", 20);
  if (blocked) return blocked;

  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = clinicPriceSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  const treatment = await prisma.treatment.findUnique({
    where: { slug: payload.data.treatmentSlug },
    select: { id: true, name: true },
  });
  if (!treatment) return NextResponse.json({ error: "TREATMENT_NOT_FOUND" }, { status: 404 });

  const data = {
    clinicId: access.clinic.id,
    treatmentId: treatment.id,
    fixedPrice: payload.data.pricingMode === "fixed" ? payload.data.fixedPrice : null,
    minPrice: payload.data.pricingMode === "range" ? payload.data.minPrice : null,
    maxPrice: payload.data.pricingMode === "range" ? payload.data.maxPrice : null,
    currency: payload.data.currency,
    priceUnit: payload.data.priceUnit,
    vatIncluded: payload.data.vatIncluded,
    examIncluded: payload.data.examIncluded,
    imagingIncluded: payload.data.imagingIncluded,
    packageContent: payload.data.packageContent,
    extraFeeConditions: payload.data.extraFeeConditions,
    moderationStatus: "PENDING" as const,
  };

  const price = await prisma.$transaction(async (tx) => {
    const pending = await tx.treatmentPrice.findFirst({
      where: { clinicId: access.clinic.id, treatmentId: treatment.id, moderationStatus: "PENDING" },
      select: { id: true },
    });
    const saved = pending
      ? await tx.treatmentPrice.update({ where: { id: pending.id }, data })
      : await tx.treatmentPrice.create({ data });
    await tx.clinicTreatment.upsert({
      where: { clinicId_treatmentId: { clinicId: access.clinic.id, treatmentId: treatment.id } },
      update: { availability: "OFFERED" },
      create: { clinicId: access.clinic.id, treatmentId: treatment.id, status: "PENDING", availability: "OFFERED" },
    });
    await tx.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "CLINIC_PRICE_SUBMITTED",
        target: saved.id,
        metadata: { clinicId: access.clinic.id, treatment: treatment.name },
      },
    });
    return saved;
  });

  return NextResponse.json({ id: price.id, status: price.moderationStatus }, { status: 201 });
}
