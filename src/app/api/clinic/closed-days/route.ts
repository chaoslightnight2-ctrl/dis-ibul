import { NextResponse } from "next/server";
import { dateKeyInIstanbul } from "@/domain/availability";
import { clinicClosedDaySchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-closed-day", 20);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicClosedDaySchema.safeParse(await readJson(request));
  if (!payload.success || payload.data.date < dateKeyInIstanbul(new Date())) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }
  try {
    const closedDay = await prisma.clinicClosedDay.create({
      data: { clinicId: access.clinic.id, date: new Date(`${payload.data.date}T00:00:00.000Z`), reason: payload.data.reason || null },
    });
    await prisma.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_CLOSED_DAY_CREATED", target: `closed-day:${closedDay.id}` } });
    return NextResponse.json({ id: closedDay.id }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "CLOSED_DAY_EXISTS" }, { status: 409 });
    }
    throw error;
  }
}
