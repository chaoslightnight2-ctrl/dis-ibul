import type { Prisma } from "@prisma/client";
import { messagingPath } from "@/domain/messaging";

type Transaction = Prisma.TransactionClient;

export async function ensureConversation(tx: Transaction, clinicId: string, userId: string) {
  return tx.conversation.upsert({
    where: { clinicId_userId: { clinicId, userId } },
    update: {},
    create: { clinicId, userId },
  });
}

export async function notifyClinicTeam(
  tx: Transaction,
  clinicId: string,
  notification: { type: string; title: string; body?: string | null; conversationId?: string },
) {
  const members = await tx.clinicTeamMember.findMany({
    where: { clinicId },
    select: { userId: true },
  });
  if (!members.length) return;

  await tx.notification.createMany({
    data: members.map(({ userId }) => ({
      userId,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      href: notification.conversationId ? messagingPath("clinic", notification.conversationId) : "/panel/klinik",
    })),
  });
}
