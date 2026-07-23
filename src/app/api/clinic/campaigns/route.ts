import { NextResponse } from "next/server";
import { clinicCampaignSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-campaign-create", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicCampaignSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const campaign = await prisma.campaign.create({
    data: {
      clinicId: access.clinic.id,
      ...payload.data,
      startsAt: payload.data.startsAt ? new Date(payload.data.startsAt) : null,
      endsAt: payload.data.endsAt ? new Date(payload.data.endsAt) : null,
    },
  });
  await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_CAMPAIGN_CREATED", target: `campaign:${campaign.id}` } });
  return NextResponse.json({ id: campaign.id }, { status: 201 });
}
