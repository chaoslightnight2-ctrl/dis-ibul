import { NextResponse } from "next/server";
import { clinicApplicationDecisionSchema } from "@/domain/validation";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const blocked = await guardMutation(request, "admin-clinic-decision", 30);
  if (blocked) return blocked;

  const user = await getRequestUser(request);
  if (!user || !["MODERATOR", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const payload = clinicApplicationDecisionSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  const { id } = await context.params;
  const application = await prisma.clinicApplication.findUnique({
    where: { id },
    include: { clinic: true },
  });
  if (!application) return NextResponse.json({ error: "APPLICATION_NOT_FOUND" }, { status: 404 });
  if (!application.clinic) return NextResponse.json({ error: "CLINIC_LINK_MISSING" }, { status: 409 });

  const clinic = application.clinic;
  if (payload.data.decision === "VERIFIED") {
    const prices = await prisma.treatmentPrice.findMany({
      where: { clinicId: clinic.id, moderationStatus: { in: ["PENDING", "APPROVED"] } },
      select: { id: true, treatmentId: true, moderationStatus: true },
    });
    const ready = clinic.address.length >= 10
      && !clinic.address.toLocaleLowerCase("tr-TR").includes("kayıt sırasında")
      && Boolean(clinic.phone)
      && prices.length > 0;
    if (!ready) {
      return NextResponse.json({ error: "PROFILE_INCOMPLETE" }, { status: 409 });
    }

    await prisma.$transaction(async (tx) => {
      const pendingPrices = prices.filter((price) => price.moderationStatus === "PENDING");
      for (const price of pendingPrices) {
        await tx.treatmentPrice.updateMany({
          where: {
            clinicId: clinic.id,
            treatmentId: price.treatmentId,
            moderationStatus: "APPROVED",
            id: { not: price.id },
          },
          data: { moderationStatus: "ARCHIVED" },
        });
        await tx.treatmentPrice.update({ where: { id: price.id }, data: { moderationStatus: "APPROVED" } });
        await tx.clinicTreatment.upsert({
          where: { clinicId_treatmentId: { clinicId: clinic.id, treatmentId: price.treatmentId } },
          update: { status: "APPROVED", availability: "OFFERED" },
          create: { clinicId: clinic.id, treatmentId: price.treatmentId, status: "APPROVED", availability: "OFFERED" },
        });
      }
      await tx.clinic.update({
        where: { id: clinic.id },
        data: { verificationStatus: "VERIFIED", isPublished: true },
      });
      await tx.clinicApplication.update({ where: { id }, data: { status: "VERIFIED" } });
      await tx.verificationApplication.create({
        data: { clinicId: clinic.id, status: "VERIFIED", note: payload.data.note || "Klinik başvurusu onaylandı." },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "CLINIC_APPLICATION_VERIFIED",
          target: clinic.id,
          metadata: { applicationId: id, note: payload.data.note ?? null },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        },
      });
    });
  } else {
    await prisma.$transaction([
      prisma.clinic.update({
        where: { id: clinic.id },
        data: { verificationStatus: payload.data.decision, isPublished: false },
      }),
      prisma.clinicApplication.update({ where: { id }, data: { status: payload.data.decision } }),
      prisma.verificationApplication.create({
        data: { clinicId: clinic.id, status: payload.data.decision, note: payload.data.note },
      }),
      prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: `CLINIC_APPLICATION_${payload.data.decision}`,
          target: clinic.id,
          metadata: { applicationId: id, note: payload.data.note },
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        },
      }),
    ]);
  }

  return NextResponse.json({ ok: true, status: payload.data.decision });
}
