import { NextResponse } from "next/server";
import { z } from "zod";
import { getRequestUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

const profileSchema = z.object({
  phone: z.string().trim().min(7).max(24),
  kvkkConsent: z.literal(true),
});

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "profile", 10);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const payload = profileSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  await prisma.$transaction([
    prisma.userProfile.update({ where: { userId: user.id }, data: { phone: payload.data.phone } }),
    prisma.consentRecord.create({
      data: {
        userId: user.id,
        consentType: "KVKK_ACCOUNT",
        consentVersion: "2026-07-14",
        granted: true,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
