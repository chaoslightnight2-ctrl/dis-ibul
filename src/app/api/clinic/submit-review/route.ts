import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-submit-review", 4);
  if (blocked) return blocked;

  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const [priceCount, application] = await Promise.all([
    prisma.treatmentPrice.count({
      where: { clinicId: access.clinic.id, moderationStatus: { in: ["PENDING", "APPROVED"] } },
    }),
    prisma.clinicApplication.findFirst({
      where: { clinicId: access.clinic.id, status: { not: "SUSPENDED" } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);
  const profileComplete = access.clinic.address.length >= 10
    && !access.clinic.address.toLocaleLowerCase("tr-TR").includes("kayıt sırasında")
    && Boolean(access.clinic.phone)
    && priceCount > 0;
  if (!profileComplete || !application) {
    return NextResponse.json({
      error: "PROFILE_INCOMPLETE",
      message: "Tam adres, telefon ve en az bir tedavi fiyatı gerekli.",
    }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.clinic.update({
      where: { id: access.clinic.id },
      data: { verificationStatus: "IN_REVIEW", isPublished: false },
    }),
    prisma.clinicApplication.update({ where: { id: application.id }, data: { status: "IN_REVIEW" } }),
    prisma.verificationApplication.create({
      data: { clinicId: access.clinic.id, status: "IN_REVIEW", note: "Klinik yöneticisi profili incelemeye gönderdi." },
    }),
    prisma.auditLog.create({
      data: { actorId: access.user.id, action: "CLINIC_SUBMITTED_FOR_REVIEW", target: access.clinic.id },
    }),
  ]);

  return NextResponse.json({ ok: true, status: "IN_REVIEW" });
}
