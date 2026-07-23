import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "notifications-read-all", 12);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const result = await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  return NextResponse.json({ updated: result.count });
}
