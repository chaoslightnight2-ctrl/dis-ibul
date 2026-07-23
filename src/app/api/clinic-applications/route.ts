import { NextResponse } from "next/server";
import { clinicApplicationSchema } from "@/domain/validation";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";
import { toSlug } from "@/lib/slug";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-application", 4);
  if (blocked) return blocked;

  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = clinicApplicationSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const existing = await prisma.clinicApplication.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PENDING_SUBMISSION", "IN_REVIEW", "ADDITIONAL_DOCUMENT_REQUIRED"] },
    },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json({ error: "APPLICATION_EXISTS", applicationId: existing.id, status: existing.status }, { status: 409 });
  }

  const suffix = user.id.slice(-6).toLowerCase();
  const slug = `${toSlug(payload.data.clinicName) || "klinik"}-${suffix}`;
  const result = await prisma.$transaction(async (tx) => {
    const clinic = await tx.clinic.create({
      data: {
        slug,
        name: payload.data.clinicName,
        city: payload.data.city,
        district: payload.data.district,
        address: "Kayıt sırasında tamamlanacak",
        phone: payload.data.phone,
        email: payload.data.email,
        verificationStatus: "PENDING_SUBMISSION",
        firstExamFee: payload.data.firstExamFee,
        freeInitialExam: payload.data.freeInitialExam,
        initialExamIncludes: ["İlk değerlendirme", "Tedavi planı görüşmesi"],
        languages: ["Türkçe"],
        paymentOptions: [],
        teamMembers: { create: { userId: user.id, role: "CLINIC_MANAGER" } },
        workingHours: {
          create: Array.from({ length: 7 }, (_, dayOfWeek) => ({
            dayOfWeek,
            opensAt: "09:00",
            closesAt: dayOfWeek === 6 ? "14:00" : "18:00",
            isClosed: dayOfWeek === 0,
          })),
        },
      },
    });
    const application = await tx.clinicApplication.create({
      data: {
        clinicName: payload.data.clinicName,
        ownerName: payload.data.ownerName,
        roleTitle: payload.data.roleTitle,
        email: payload.data.email,
        phone: payload.data.phone,
        city: payload.data.city,
        district: payload.data.district,
        specialties: payload.data.specialties,
        firstExamFee: payload.data.firstExamFee,
        freeInitialExam: payload.data.freeInitialExam,
        googlePlaceId: payload.data.googlePlaceId || null,
        kvkkConsent: payload.data.kvkkConsent,
        moderationConsent: payload.data.moderationConsent,
        userId: user.id,
        clinicId: clinic.id,
      },
    });
    if (payload.data.googlePlaceId) {
      await tx.googlePlaceConnection.create({
        data: {
          clinicId: clinic.id,
          googlePlaceId: payload.data.googlePlaceId,
          googleConnectedByClinic: true,
        },
      });
    }
    await tx.verificationApplication.create({
      data: {
        clinicId: clinic.id,
        status: "PENDING_SUBMISSION",
        note: "Klinik yöneticisi ilk başvuruyu oluşturdu.",
      },
    });
    await tx.user.update({ where: { id: user.id }, data: { role: "CLINIC_MANAGER" } });
    await tx.consentRecord.create({
      data: {
        userId: user.id,
        consentType: "KVKK_CLINIC_APPLICATION",
        consentVersion: "2026-07-14",
        granted: true,
      },
    });
    return { application, clinic };
  });

  return NextResponse.json({
    status: "PENDING_SUBMISSION",
    applicationId: result.application.id,
    clinicSlug: result.clinic.slug,
    nextSteps: [
      "E-posta ve telefon doğrulaması",
      "Vergi/işletme belgesi yükleme",
      "Google işletme profili eşleştirme",
      "Tedavi ve fiyat bilgisi moderasyon kontrolü",
    ],
  }, { status: 201 });
}
