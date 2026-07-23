import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const origin = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const managerEmail = `operations-manager-${suffix}@example.test`;
const patientEmail = `operations-patient-${suffix}@example.test`;
const secondPatientEmail = `operations-second-${suffix}@example.test`;
const clinicSlug = `operations-test-${suffix}`;

function requireStatus(response: Response, expected: number, operation: string) {
  if (response.status !== expected) throw new Error(`${operation}_FAILED:${response.status}`);
}

function cookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return (headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""]).filter(Boolean).map((value) => value.split(";", 1)[0]).join("; ");
}

async function signup(name: string, email: string) {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, { method: "POST", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify({ name, email, password: "Test-Password-2026!" }) });
  requireStatus(response, 200, `SIGNUP_${email}`);
  const cookie = cookieHeader(response);
  if (!cookie) throw new Error(`SIGNUP_COOKIE_MISSING:${email}`);
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
  return { cookie, user };
}

async function api(url: string, method: string, cookie?: string, body?: unknown) {
  return fetch(`${origin}${url}`, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), Origin: origin }, body: body ? JSON.stringify(body) : undefined });
}

function futureWeekday(daysAhead: number) {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

async function cleanup() {
  await prisma.clinic.deleteMany({ where: { slug: { startsWith: "operations-test-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "operations-", endsWith: "@example.test" } } });
}

async function main() {
  await cleanup();
  try {
    const manager = await signup("Operations Test Manager", managerEmail);
    const patient = await signup("Operations Test Patient", patientEmail);
    const secondPatient = await signup("Operations Second Patient", secondPatientEmail);
    await prisma.user.update({ where: { id: manager.user.id }, data: { role: "CLINIC_MANAGER" } });
    const clinic = await prisma.clinic.create({ data: { slug: clinicSlug, name: "Operations Test Clinic", city: "İstanbul", district: "Kadıköy", address: "Test Mahallesi Takvim Caddesi No 10", initialExamIncludes: [], languages: ["Türkçe"], paymentOptions: [], isPublished: true } });
    await prisma.clinicTeamMember.create({ data: { clinicId: clinic.id, userId: manager.user.id, role: "CLINIC_MANAGER" } });

    const hours = Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, opensAt: "09:00", closesAt: "12:00", isClosed: dayOfWeek === 0 || dayOfWeek === 6 }));
    requireStatus(await api("/api/clinic/working-hours", "PUT", manager.cookie, { appointmentDurationMinutes: 30, bookingLeadHours: 0, bookingWindowDays: 90, hours }), 200, "WORKING_HOURS_UPDATE");

    const appointmentDate = futureWeekday(3);
    const availabilityResponse = await api(`/api/availability?clinicSlug=${clinicSlug}&date=${appointmentDate}`, "GET");
    requireStatus(availabilityResponse, 200, "AVAILABILITY_READ");
    const availability = await availabilityResponse.json() as { slots: Array<{ start: string }> };
    if (!availability.slots.length) throw new Error("AVAILABLE_SLOT_MISSING");
    const slot = availability.slots[0].start;
    const appointmentBody = { clinicSlug, treatmentName: "Genel muayene", preferredDate: slot, fullName: "Operations Test Patient", phone: "+905551112233", note: "Takvim testi", kvkkConsent: true };
    requireStatus(await api("/api/appointment-requests", "POST", patient.cookie, appointmentBody), 201, "FIRST_SLOT_RESERVATION");
    requireStatus(await api("/api/appointment-requests", "POST", secondPatient.cookie, { ...appointmentBody, fullName: "Operations Second Patient", phone: "+905559998877" }), 409, "DOUBLE_BOOKING_BLOCK");

    const closedDate = futureWeekday(7);
    const closedDayResponse = await api("/api/clinic/closed-days", "POST", manager.cookie, { date: closedDate, reason: "Resmi tatil" });
    requireStatus(closedDayResponse, 201, "CLOSED_DAY_CREATE");
    const closedDay = await closedDayResponse.json() as { id: string };
    const closedAvailability = await api(`/api/availability?clinicSlug=${clinicSlug}&date=${closedDate}`, "GET");
    requireStatus(closedAvailability, 200, "CLOSED_DAY_AVAILABILITY");
    if ((await closedAvailability.json() as { reason: string }).reason !== "CLOSED_DAY") throw new Error("CLOSED_DAY_NOT_ENFORCED");

    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const endsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const campaignResponse = await api("/api/clinic/campaigns", "POST", manager.cookie, { title: "Test kampanyası", description: "Test kapsamı", startsAt, endsAt, isActive: true });
    requireStatus(campaignResponse, 201, "CAMPAIGN_CREATE");
    const campaign = await campaignResponse.json() as { id: string };
    requireStatus(await api(`/api/clinic/campaigns/${campaign.id}`, "PATCH", manager.cookie, { title: "Güncel test kampanyası", description: "Güncel kapsam", startsAt, endsAt, isActive: true }), 200, "CAMPAIGN_UPDATE");

    const packageResponse = await api("/api/clinic/packages", "POST", manager.cookie, { name: "Kontrol paketi", description: "Muayene ve planlama", price: 1250, currency: "TRY", startsAt, endsAt, isActive: true });
    requireStatus(packageResponse, 201, "PACKAGE_CREATE");
    const treatmentPackage = await packageResponse.json() as { id: string };
    requireStatus(await api(`/api/clinic/packages/${treatmentPackage.id}`, "PATCH", manager.cookie, { name: "Güncel kontrol paketi", description: "Muayene ve ayrıntılı planlama", price: 1500, currency: "TRY", startsAt, endsAt, isActive: true }), 200, "PACKAGE_UPDATE");
    requireStatus(await api(`/api/clinic/campaigns/${campaign.id}`, "DELETE", manager.cookie), 200, "CAMPAIGN_ARCHIVE");
    requireStatus(await api(`/api/clinic/packages/${treatmentPackage.id}`, "DELETE", manager.cookie), 200, "PACKAGE_ARCHIVE");
    requireStatus(await api(`/api/clinic/closed-days/${closedDay.id}`, "DELETE", manager.cookie), 200, "CLOSED_DAY_DELETE");

    const state = await prisma.clinic.findUniqueOrThrow({ where: { id: clinic.id }, include: { campaigns: true, packages: true } });
    if (state.appointmentDurationMinutes !== 30 || state.campaigns.some((item) => item.isActive) || state.packages.some((item) => item.isActive)) throw new Error("OPERATIONS_STATE_INVALID");
    console.log("Operations lifecycle smoke test passed: hours -> availability -> reservation lock -> closed day -> campaign/package archive");
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "OPERATIONS_SMOKE_TEST_FAILED");
  process.exitCode = 1;
});
