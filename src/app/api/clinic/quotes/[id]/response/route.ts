import { NextResponse } from "next/server";
import { z } from "zod";
import { messagingPath } from "@/domain/messaging";
import { ensureConversation } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const optionalMoney = z.preprocess((value) => value === "" || value === null ? undefined : value, z.coerce.number().nonnegative().optional());
const responseSchema = z.object({
  estimatedMinPrice: optionalMoney,
  estimatedMaxPrice: optionalMoney,
  includedItems: z.string().trim().min(3).max(1000),
  estimatedSessions: z.coerce.number().int().positive().max(100).optional(),
  note: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-quote-response", 20);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user || !["CLINIC_MANAGER", "DENTIST", "MODERATOR", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const payload = responseSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  if (payload.data.estimatedMinPrice && payload.data.estimatedMaxPrice && payload.data.estimatedMinPrice > payload.data.estimatedMaxPrice) {
    return NextResponse.json({ error: "INVALID_PRICE_RANGE" }, { status: 400 });
  }
  const { id } = await context.params;
  const requestClinic = await prisma.quoteRequestClinic.findFirst({
    where: {
      id,
      clinic: user.role === "MODERATOR" || user.role === "SUPER_ADMIN" ? undefined : { teamMembers: { some: { userId: user.id } } },
    },
    select: {
      id: true,
      clinicId: true,
      response: { select: { id: true } },
      clinic: { select: { name: true } },
      quoteRequest: { select: { userId: true, treatmentName: true } },
    },
  });
  if (!requestClinic) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const response = await prisma.$transaction(async (tx) => {
    const saved = await tx.quoteResponse.upsert({
      where: { quoteRequestClinicId: id },
      update: payload.data,
      create: { quoteRequestClinicId: id, ...payload.data },
    });
    if (requestClinic.quoteRequest.userId) {
      const conversation = await ensureConversation(tx, requestClinic.clinicId, requestClinic.quoteRequest.userId);
      await tx.notification.create({
        data: {
          userId: requestClinic.quoteRequest.userId,
          type: "QUOTE_RESPONSE",
          title: requestClinic.response ? "Fiyat teklifiniz güncellendi" : "Yeni fiyat teklifi geldi",
          body: `${requestClinic.clinic.name}, ${requestClinic.quoteRequest.treatmentName} talebinize yanıt verdi.`,
          href: messagingPath("patient", conversation.id),
        },
      });
    }
    return saved;
  });
  return NextResponse.json({ id: response.id }, { status: 201 });
}
