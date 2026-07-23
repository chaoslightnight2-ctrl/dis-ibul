import { dateKeyInIstanbul, generateSlotTimes, istanbulDateTime } from "@/domain/availability";
import { prisma } from "@/lib/prisma";

const blockingStatuses = ["PENDING", "VIEWED_BY_CLINIC", "INFO_REQUESTED", "APPROVED", "ALTERNATIVE_TIME_PROPOSED", "PATIENT_CONFIRMED"] as const;

export async function getClinicAvailability({
  clinicId,
  date,
  dentistId,
}: {
  clinicId: string;
  date: string;
  dentistId?: string;
}) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { appointmentDurationMinutes: true, bookingLeadHours: true, bookingWindowDays: true },
  });
  if (!clinic) return { available: false, reason: "CLINIC_NOT_FOUND", slots: [] as Array<{ start: string; label: string }> };

  const dayStart = istanbulDateTime(date, "00:00");
  const nextDay = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();
  const leadBoundary = new Date(now.getTime() + clinic.bookingLeadHours * 60 * 60 * 1000);
  const latestDate = new Date(now.getTime() + clinic.bookingWindowDays * 24 * 60 * 60 * 1000);
  if (nextDay <= now) return { available: false, reason: "DATE_IN_PAST", slots: [] };
  if (dayStart > latestDate) return { available: false, reason: "DATE_OUTSIDE_BOOKING_WINDOW", slots: [] };

  if (dentistId) {
    const dentist = await prisma.dentist.findFirst({ where: { id: dentistId, clinicId, isActive: true }, select: { id: true } });
    if (!dentist) return { available: false, reason: "DENTIST_NOT_FOUND", slots: [] };
  }
  const dayOfWeek = new Date(`${date}T12:00:00+03:00`).getUTCDay();
  const dentistHour = dentistId
    ? await prisma.workingHour.findFirst({ where: { clinicId, dentistId, dayOfWeek } })
    : null;
  const workingHour = dentistHour ?? await prisma.workingHour.findFirst({
    where: { clinicId, branchId: null, dentistId: null, dayOfWeek },
  });
  if (!workingHour || workingHour.isClosed) return { available: false, reason: "CLINIC_CLOSED", slots: [] };

  const dateRecord = new Date(`${date}T00:00:00.000Z`);
  const closedDay = await prisma.clinicClosedDay.findFirst({
    where: {
      clinicId,
      date: dateRecord,
      OR: [
        { branchId: null, dentistId: null },
        ...(dentistId ? [{ dentistId }] : []),
      ],
    },
    select: { id: true },
  });
  if (closedDay) return { available: false, reason: "CLOSED_DAY", slots: [] };

  const occupied = await prisma.appointmentRequest.findMany({
    where: {
      clinicId,
      ...(dentistId ? { dentistId } : {}),
      preferredDate: { gte: dayStart, lt: nextDay },
      status: { in: [...blockingStatuses] },
    },
    select: { preferredDate: true },
  });
  const occupiedTimes = new Set(occupied.flatMap((appointment) => appointment.preferredDate ? [appointment.preferredDate.getTime()] : []));
  const slots = generateSlotTimes(workingHour.opensAt, workingHour.closesAt, clinic.appointmentDurationMinutes)
    .map((label) => ({ label, value: istanbulDateTime(date, label) }))
    .filter(({ value }) => value >= leadBoundary && !occupiedTimes.has(value.getTime()))
    .slice(0, 48)
    .map(({ label, value }) => ({ label, start: value.toISOString() }));

  return {
    available: slots.length > 0,
    reason: slots.length ? null : "NO_AVAILABLE_SLOTS",
    date: dateKeyInIstanbul(dayStart),
    durationMinutes: clinic.appointmentDurationMinutes,
    slots,
  };
}

export { blockingStatuses };
