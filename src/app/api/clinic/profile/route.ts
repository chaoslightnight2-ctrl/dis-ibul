import { NextResponse } from "next/server";
import { clinicProfileUpdateSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request) {
  const blocked = await guardMutation(request, "clinic-profile", 12);
  if (blocked) return blocked;

  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = clinicProfileUpdateSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.clinic.update({
      where: { id: access.clinic.id },
      data: {
        ...payload.data,
        firstExamFee: payload.data.freeInitialExam ? 0 : payload.data.firstExamFee,
        verificationStatus: "PENDING_SUBMISSION",
        isPublished: false,
      },
      select: { slug: true, verificationStatus: true },
    });
    await tx.clinicApplication.updateMany({
      where: { clinicId: access.clinic.id, status: { not: "SUSPENDED" } },
      data: {
        clinicName: payload.data.name,
        phone: payload.data.phone,
        city: payload.data.city,
        district: payload.data.district,
        firstExamFee: payload.data.freeInitialExam ? 0 : payload.data.firstExamFee ?? 0,
        freeInitialExam: payload.data.freeInitialExam,
        status: "PENDING_SUBMISSION",
      },
    });
    await tx.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "CLINIC_PROFILE_UPDATED",
        target: access.clinic.id,
        metadata: { slug: updated.slug },
      },
    });
    return updated;
  });

  return NextResponse.json({ ok: true, profile });
}
