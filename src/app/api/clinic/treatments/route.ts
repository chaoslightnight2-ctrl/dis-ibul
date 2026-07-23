import { NextResponse } from "next/server";
import { clinicTreatmentCapabilitySchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request) {
  const blocked = await guardMutation(request, "clinic-treatment-capability", 60);
  if (blocked) return blocked;

  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = clinicTreatmentCapabilitySchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  const treatment = await prisma.treatment.findUnique({
    where: { slug: payload.data.treatmentSlug },
    select: { id: true, name: true },
  });
  if (!treatment) return NextResponse.json({ error: "TREATMENT_NOT_FOUND" }, { status: 404 });

  const activePriceCount = await prisma.treatmentPrice.count({
    where: {
      clinicId: access.clinic.id,
      treatmentId: treatment.id,
      moderationStatus: { not: "ARCHIVED" },
    },
  });
  if (activePriceCount > 0 && payload.data.availability !== "OFFERED") {
    return NextResponse.json({
      error: "ACTIVE_PRICE_EXISTS",
      message: "Aktif fiyat kaydı bulunan tedavi yapılmıyor veya belirtilmedi olarak işaretlenemez.",
    }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    const previous = await tx.clinicTreatment.findUnique({
      where: { clinicId_treatmentId: { clinicId: access.clinic.id, treatmentId: treatment.id } },
      select: { availability: true, status: true },
    });

    if (payload.data.availability === "UNKNOWN") {
      await tx.clinicTreatment.deleteMany({
        where: { clinicId: access.clinic.id, treatmentId: treatment.id },
      });
    } else {
      await tx.clinicTreatment.upsert({
        where: { clinicId_treatmentId: { clinicId: access.clinic.id, treatmentId: treatment.id } },
        update: { availability: payload.data.availability, status: "APPROVED" },
        create: {
          clinicId: access.clinic.id,
          treatmentId: treatment.id,
          availability: payload.data.availability,
          status: "APPROVED",
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "CLINIC_TREATMENT_CAPABILITY_UPDATED",
        target: `${access.clinic.id}:${treatment.id}`,
        metadata: {
          clinicId: access.clinic.id,
          treatment: treatment.name,
          previousAvailability: previous?.availability ?? "UNKNOWN",
          availability: payload.data.availability,
        },
      },
    });
  });

  return NextResponse.json({ treatmentSlug: payload.data.treatmentSlug, availability: payload.data.availability });
}
