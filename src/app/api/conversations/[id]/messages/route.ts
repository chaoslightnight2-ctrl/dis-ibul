import { NextResponse } from "next/server";
import { messageBodySchema, messagePreview, messagingPath } from "@/domain/messaging";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const clinicRoles = new Set(["CLINIC_MANAGER", "DENTIST"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "conversation-message", 30);
  if (blocked) return blocked;

  const user = await getRequestUser(request);
  if (!user || (user.role !== "PATIENT" && !clinicRoles.has(user.role))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const payload = messageBodySchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const { id } = await context.params;
  const patientView = user.role === "PATIENT";
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(patientView
        ? { userId: user.id }
        : { clinic: { teamMembers: { some: { userId: user.id } } } }),
    },
    include: { clinic: { select: { id: true, name: true } } },
  });
  if (!conversation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.message.create({
      data: { conversationId: id, senderId: user.id, body: payload.data.body },
    });
    await tx.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    const notification = {
      type: "MESSAGE",
      title: patientView ? `${user.name} yeni bir mesaj gönderdi` : `${conversation.clinic.name} yeni bir mesaj gönderdi`,
      body: messagePreview(payload.data.body),
    };
    if (patientView) {
      const members = await tx.clinicTeamMember.findMany({
        where: { clinicId: conversation.clinicId },
        select: { userId: true },
      });
      if (members.length) {
        await tx.notification.createMany({
          data: members.map(({ userId }) => ({
            ...notification,
            userId,
            href: messagingPath("clinic", id),
          })),
        });
      }
    } else {
      await tx.notification.create({
        data: { ...notification, userId: conversation.userId, href: messagingPath("patient", id) },
      });
    }
    return created;
  });

  return NextResponse.json({ id: message.id, createdAt: message.createdAt }, { status: 201 });
}
