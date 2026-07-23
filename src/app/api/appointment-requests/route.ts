import { NextResponse } from "next/server";
import { dateKeyInIstanbul } from "@/domain/availability";
import { appointmentRequestSchema } from "@/domain/validation";
import { ensureConversation, notifyClinicTeam } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";
import { blockingStatuses, getClinicAvailability } from "@/services/appointments/availability";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "appointment", 8);
  if (blocked) return blocked;

  const user = await getRequestUser(request);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = appointmentRequestSchema.safeParse(await readJson(request));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  const clinic = await prisma.clinic.findFirst({
    where: { slug: payload.data.clinicSlug, isPublished: true },
    select: { id: true, name: true },
  });
  if (!clinic) return NextResponse.json({ error: "CLINIC_NOT_FOUND" }, { status: 404 });

  const preferredDate = payload.data.preferredDate ? new Date(payload.data.preferredDate) : null;
  if (preferredDate) {
    const availability = await getClinicAvailability({ clinicId: clinic.id, date: dateKeyInIstanbul(preferredDate) });
    if (!availability.slots.some((slot) => new Date(slot.start).getTime() === preferredDate.getTime())) {
      return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
    }
  }

  let appointment;
  try {
    appointment = await prisma.$transaction(async (tx) => {
      if (preferredDate) {
        const conflict = await tx.appointmentRequest.count({
          where: { clinicId: clinic.id, preferredDate, status: { in: [...blockingStatuses] } },
        });
        if (conflict) throw new Error("SLOT_UNAVAILABLE");
      }
      const created = await tx.appointmentRequest.create({
        data: {
          userId: user.id,
          clinicId: clinic.id,
          treatmentName: payload.data.treatmentName,
          requesterName: payload.data.fullName,
          requesterPhone: payload.data.phone,
          preferredDate,
          note: payload.data.note || null,
          kvkkConsent: true,
          history: { create: { status: "PENDING", note: "Hasta talebi oluşturdu." } },
        },
      });
      await tx.consentRecord.create({
        data: {
          userId: user.id,
          consentType: "KVKK_APPOINTMENT",
          consentVersion: "2026-07-14",
          granted: true,
        },
      });
      const conversation = await ensureConversation(tx, clinic.id, user.id);
      await notifyClinicTeam(tx, clinic.id, {
        type: "APPOINTMENT_CREATED",
        title: "Yeni randevu talebi",
        body: `${payload.data.fullName}, ${payload.data.treatmentName} için talep oluşturdu.`,
        conversationId: conversation.id,
      });
      return created;
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if ((error instanceof Error && error.message === "SLOT_UNAVAILABLE") || (typeof error === "object" && error !== null && "code" in error && error.code === "P2034")) {
      return NextResponse.json({ error: "SLOT_UNAVAILABLE" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({
    id: appointment.id,
    status: appointment.status,
    message: "Randevu talebiniz kliniğe iletildi.",
  }, { status: 201 });
}
