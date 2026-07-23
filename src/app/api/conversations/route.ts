import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";

const clinicRoles = new Set(["CLINIC_MANAGER", "DENTIST"]);

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user || (user.role !== "PATIENT" && !clinicRoles.has(user.role))) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const patientView = user.role === "PATIENT";
  const conversations = await prisma.conversation.findMany({
    where: patientView
      ? { userId: user.id }
      : { clinic: { teamMembers: { some: { userId: user.id } } } },
    include: {
      clinic: { select: { name: true, slug: true, city: true, district: true } },
      user: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, senderId: true, readAt: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const conversationIds = conversations.map(({ id }) => id);
  const unreadMessages = conversationIds.length
    ? await prisma.message.findMany({
        where: {
          conversationId: { in: conversationIds },
          readAt: null,
          ...(patientView ? { senderId: { not: user.id } } : { sender: { role: "PATIENT" } }),
        },
        select: { conversationId: true },
      })
    : [];
  const unreadByConversation = unreadMessages.reduce((counts, message) => {
    counts.set(message.conversationId, (counts.get(message.conversationId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());

  return NextResponse.json({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      title: patientView ? conversation.clinic.name : conversation.user.name,
      subtitle: patientView
        ? `${conversation.clinic.city}, ${conversation.clinic.district}`
        : conversation.clinic.name,
      clinicSlug: conversation.clinic.slug,
      updatedAt: conversation.updatedAt,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      lastMessage: conversation.messages[0] ?? null,
    })),
  });
}
