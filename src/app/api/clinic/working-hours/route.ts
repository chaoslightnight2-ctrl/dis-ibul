import { NextResponse } from "next/server";
import { clinicWorkingHoursSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function PUT(request: Request) {
  const blocked = await guardMutation(request, "clinic-working-hours", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicWorkingHoursSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.clinic.update({
      where: { id: access.clinic.id },
      data: {
        appointmentDurationMinutes: payload.data.appointmentDurationMinutes,
        bookingLeadHours: payload.data.bookingLeadHours,
        bookingWindowDays: payload.data.bookingWindowDays,
      },
    });
    await tx.workingHour.deleteMany({ where: { clinicId: access.clinic.id, branchId: null, dentistId: null } });
    await tx.workingHour.createMany({ data: payload.data.hours.map((hour) => ({ clinicId: access.clinic.id, ...hour })) });
    await tx.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_WORKING_HOURS_UPDATED", target: `clinic:${access.clinic.id}` } });
  }, { isolationLevel: "Serializable" });
  return NextResponse.json({ updated: true });
}
