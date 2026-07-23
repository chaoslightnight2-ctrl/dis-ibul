import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

const preferencesSchema = z.object({
  appointmentUpdates: z.boolean(),
  quoteUpdates: z.boolean(),
  productNews: z.boolean(),
});

export async function PATCH(request: Request) {
  const blocked = await guardMutation(request, "account-preferences", 10);
  if (blocked) return blocked;
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (user.role !== "PATIENT") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const payload = preferencesSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  await prisma.$transaction([
    prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: {
        notificationPreferences: payload.data,
        marketingConsent: payload.data.productNews,
      },
      create: {
        userId: user.id,
        notificationPreferences: payload.data,
        marketingConsent: payload.data.productNews,
      },
    }),
    prisma.consentRecord.create({
      data: {
        userId: user.id,
        consentType: "KVKK_MARKETING",
        consentVersion: "2026-07-14",
        granted: payload.data.productNews,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
      },
    }),
  ]);

  return NextResponse.json({ preferences: payload.data });
}
