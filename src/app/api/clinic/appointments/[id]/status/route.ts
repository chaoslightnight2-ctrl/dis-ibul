import { NextResponse } from "next/server";
import { z } from "zod";
import { appointmentStatusCopy, messagingPath } from "@/domain/messaging";
import { ensureConversation } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const statusSchema = z.object({
  status: z.enum(["VIEWED_BY_CLINIC", "INFO_REQUESTED", "APPROVED", "ALTERNATIVE_TIME_PROPOSED", "CANCELLED", "COMPLETED", "NO_SHOW"]),
  note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-appointment-status", 30);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user || !["CLINIC_MANAGER", "DENTIST", "MODERATOR", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = statusSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;

  const appointment = await prisma.appointmentRequest.findFirst({
    where: {
      id,
      clinic: user.role === "MODERATOR" || user.role === "SUPER_ADMIN" ? undefined : { teamMembers: { some: { userId: user.id } } },
    },
    select: {
      id: true,
      status: true,
      userId: true,
      clinicId: true,
      treatmentName: true,
      clinic: { select: { name: true } },
    },
  });
  if (!appointment) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (appointment.status === payload.data.status) {
    return NextResponse.json({ id: appointment.id, status: appointment.status });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const record = await tx.appointmentRequest.update({ where: { id }, data: { status: payload.data.status } });
    await tx.appointmentStatusHistory.create({
      data: { appointmentRequestId: id, status: payload.data.status, note: payload.data.note || null },
    });
    if (appointment.userId) {
      const conversation = await ensureConversation(tx, appointment.clinicId, appointment.userId);
      const copy = appointmentStatusCopy[payload.data.status];
      await tx.notification.create({
        data: {
          userId: appointment.userId,
          type: "APPOINTMENT_STATUS",
          title: copy.title,
          body: `${appointment.clinic.name}: ${copy.body}`,
          href: messagingPath("patient", conversation.id),
        },
      });
    }
    return record;
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
