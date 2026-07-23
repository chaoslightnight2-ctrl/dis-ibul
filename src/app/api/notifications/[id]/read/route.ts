import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "notification-read", 60);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await context.params;
  const result = await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { readAt: new Date() },
  });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ id, read: true });
}
