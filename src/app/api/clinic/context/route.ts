import { NextResponse } from "next/server";
import { z } from "zod";
import { ACTIVE_CLINIC_COOKIE } from "@/lib/clinic-context";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const contextSchema = z.object({ clinicId: z.string().min(1).max(100) });

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-context", 30);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = contextSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const membership = await prisma.clinicTeamMember.findUnique({
    where: { clinicId_userId: { clinicId: payload.data.clinicId, userId: user.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const response = NextResponse.json({ clinicId: payload.data.clinicId });
  response.cookies.set(ACTIVE_CLINIC_COOKIE, payload.data.clinicId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
