import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const deletionSchema = z.object({ confirmation: z.literal("HESABIMI_SIL") });

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "account-deletion", 3);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = deletionSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const existing = await prisma.dataDeletionRequest.findFirst({
    where: { userId: user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return NextResponse.json({ request: existing, alreadyPending: true });

  const deletionRequest = await prisma.$transaction(async (tx) => {
    const created = await tx.dataDeletionRequest.create({
      data: { userId: user.id, requestedBy: "USER" },
    });
    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "ACCOUNT_DELETION_REQUESTED",
        target: `user:${user.id}`,
        metadata: { deletionRequestId: created.id },
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      },
    });
    return created;
  });

  return NextResponse.json({ request: deletionRequest, alreadyPending: false }, { status: 201 });
}

export async function DELETE(request: Request) {
  const blocked = await guardMutation(request, "account-deletion-cancel", 3);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.dataDeletionRequest.updateMany({
      where: { userId: user.id, status: "PENDING" },
      data: { status: "CANCELLED", resolvedAt: new Date() },
    });
    if (updated.count) {
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: "ACCOUNT_DELETION_CANCELLED",
          target: `user:${user.id}`,
          ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        },
      });
    }
    return updated;
  });

  return NextResponse.json({ cancelled: result.count > 0 });
}
