import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";

const clinicRoles = new Set(["CLINIC_MANAGER", "DENTIST"]);

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request);
  if (!user || (user.role !== "PATIENT" && !clinicRoles.has(user.role))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await context.params;
  const patientView = user.role === "PATIENT";
  const conversation = await prisma.conversation.findFirst({
    where: {
      id,
      ...(patientView
        ? { userId: user.id }
        : { clinic: { teamMembers: { some: { userId: user.id } } } }),
    },
    include: {
      clinic: { select: { name: true, slug: true, city: true, district: true } },
      user: { select: { name: true } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const incomingFilter = patientView
    ? { senderId: { not: user.id } }
    : { senderId: conversation.userId };
  await prisma.$transaction([
    prisma.message.updateMany({
      where: { conversationId: id, readAt: null, ...incomingFilter },
      data: { readAt: new Date() },
    }),
    prisma.notification.updateMany({
      where: { userId: user.id, type: "MESSAGE", href: { contains: `konusma=${id}` }, readAt: null },
      data: { readAt: new Date() },
    }),
  ]);

  const newestMessages = await prisma.message.findMany({
    where: { conversationId: id },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({
    conversation: {
      id: conversation.id,
      title: patientView ? conversation.clinic.name : conversation.user.name,
      subtitle: patientView
        ? `${conversation.clinic.city}, ${conversation.clinic.district}`
        : conversation.clinic.name,
      clinicSlug: conversation.clinic.slug,
    },
    messages: newestMessages.reverse().map((message) => ({
      id: message.id,
      body: message.body,
      mine: message.senderId === user.id,
      senderName: message.sender?.name ?? "Silinmiş kullanıcı",
      readAt: message.readAt,
      createdAt: message.createdAt,
    })),
  });
}
