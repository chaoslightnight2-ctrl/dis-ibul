import { NextResponse } from "next/server";
import { clinicCampaignSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-campaign-update", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicCampaignSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;
  const result = await prisma.campaign.updateMany({
    where: { id, clinicId: access.clinic.id },
    data: { ...payload.data, startsAt: payload.data.startsAt ? new Date(payload.data.startsAt) : null, endsAt: payload.data.endsAt ? new Date(payload.data.endsAt) : null },
  });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_CAMPAIGN_UPDATED", target: `campaign:${id}` } });
  return NextResponse.json({ id });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-campaign-archive", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const result = await prisma.campaign.updateMany({ where: { id, clinicId: access.clinic.id }, data: { isActive: false } });
  if (!result.count) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ id, archived: true });
}
