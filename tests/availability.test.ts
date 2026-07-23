import { describe, expect, it } from "vitest";
import { dateKeyInIstanbul, generateSlotTimes, istanbulDateTime } from "../src/domain/availability";
import { appointmentRequestSchema, clinicCampaignSchema, clinicWorkingHoursSchema } from "../src/domain/validation";

describe("appointment availability math", () => {
  it("creates fixed-duration slots without crossing closing time", () => {
    expect(generateSlotTimes("09:00", "10:45", 30)).toEqual(["09:00", "09:30", "10:00"]);
    expect(generateSlotTimes("09:00", "09:20", 30)).toEqual([]);
  });

  it("uses Turkey's fixed UTC+3 offset for public slot timestamps", () => {
    expect(istanbulDateTime("2026-07-20", "09:30").toISOString()).toBe("2026-07-20T06:30:00.000Z");
    expect(dateKeyInIstanbul(new Date("2026-07-19T22:30:00.000Z"))).toBe("2026-07-20");
  });
});

describe("clinic calendar validation", () => {
  const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: "18:00", isClosed: dayOfWeek === 0 }));

  it("requires seven unique days and a valid opening interval", () => {
    expect(clinicWorkingHoursSchema.safeParse({ appointmentDurationMinutes: 30, bookingLeadHours: 2, bookingWindowDays: 60, hours }).success).toBe(true);
    expect(clinicWorkingHoursSchema.safeParse({ appointmentDurationMinutes: 30, bookingLeadHours: 2, bookingWindowDays: 60, hours: hours.map((hour) => ({ ...hour, dayOfWeek: 1 })) }).success).toBe(false);
    expect(clinicWorkingHoursSchema.safeParse({ appointmentDurationMinutes: 30, bookingLeadHours: 2, bookingWindowDays: 60, hours: hours.map((hour) => hour.dayOfWeek === 2 ? { ...hour, opensAt: "18:00", closesAt: "09:00" } : hour) }).success).toBe(false);
  });

  it("rejects reversed campaign dates and local datetimes without an offset", () => {
    expect(clinicCampaignSchema.safeParse({ title: "Yaz kampanyası", description: "", startsAt: "2026-08-02T09:00:00+03:00", endsAt: "2026-08-01T09:00:00+03:00", isActive: true }).success).toBe(false);
    expect(appointmentRequestSchema.safeParse({ clinicSlug: "test", treatmentName: "Muayene", preferredDate: "2026-08-01T09:00", fullName: "Test Hasta", phone: "5551112233", kvkkConsent: true }).success).toBe(false);
  });
});
