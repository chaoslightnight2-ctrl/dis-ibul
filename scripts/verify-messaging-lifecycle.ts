import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const origin = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const patientEmail = `messaging-patient-${suffix}@example.test`;
const managerEmail = `messaging-manager-${suffix}@example.test`;
const intruderEmail = `messaging-intruder-${suffix}@example.test`;
const clinicSlug = `messaging-test-${suffix}`;

function requireStatus(response: Response, expected: number, operation: string) {
  if (response.status !== expected) throw new Error(`${operation}_FAILED:${response.status}`);
}

function cookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  return (headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""])
    .filter(Boolean)
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}

async function signup(name: string, email: string) {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify({ name, email, password: "Test-Password-2026!" }),
  });
  requireStatus(response, 200, `SIGNUP_${email}`);
  const cookie = cookieHeader(response);
  if (!cookie) throw new Error(`SIGNUP_COOKIE_MISSING:${email}`);
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true, emailVerifiedAt: new Date() },
  });
  return { cookie, user };
}

async function cleanup() {
  await prisma.clinic.deleteMany({ where: { slug: { startsWith: "messaging-test-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "messaging-", endsWith: "@example.test" } } });
}

async function main() {
  await cleanup();
  try {
    const patient = await signup("Messaging Test Patient", patientEmail);
    const manager = await signup("Messaging Test Manager", managerEmail);
    const intruder = await signup("Messaging Test Intruder", intruderEmail);
    await prisma.user.update({ where: { id: manager.user.id }, data: { role: "CLINIC_MANAGER" } });

    const clinic = await prisma.clinic.create({
      data: {
        slug: clinicSlug,
        name: "Messaging Test Clinic",
        city: "İstanbul",
        district: "Kadıköy",
        address: "Test Mahallesi Test Caddesi No 10",
        initialExamIncludes: [],
        languages: ["Türkçe"],
        paymentOptions: [],
        isPublished: true,
      },
    });
    await prisma.clinicTeamMember.create({
      data: { clinicId: clinic.id, userId: manager.user.id, role: "CLINIC_MANAGER" },
    });

    const appointmentResponse = await fetch(`${origin}/api/appointment-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: patient.cookie, Origin: origin },
      body: JSON.stringify({
        clinicSlug,
        treatmentName: "İmplant muayenesi",
        fullName: "Messaging Test Patient",
        phone: "+905551112233",
        note: "Uygun zamanı konuşmak istiyorum.",
        kvkkConsent: true,
      }),
    });
    requireStatus(appointmentResponse, 201, "APPOINTMENT_CREATE");
    const appointment = await appointmentResponse.json() as { id: string };

    const conversation = await prisma.conversation.findUniqueOrThrow({
      where: { clinicId_userId: { clinicId: clinic.id, userId: patient.user.id } },
    });
    const clinicNotification = await prisma.notification.findFirst({
      where: { userId: manager.user.id, type: "APPOINTMENT_CREATED" },
    });
    if (!clinicNotification?.href?.includes(conversation.id)) throw new Error("CLINIC_NOTIFICATION_LINK_INVALID");

    const clinicListResponse = await fetch(`${origin}/api/conversations`, { headers: { Cookie: manager.cookie } });
    requireStatus(clinicListResponse, 200, "CLINIC_CONVERSATION_LIST");
    const clinicList = await clinicListResponse.json() as { conversations: Array<{ id: string }> };
    if (!clinicList.conversations.some(({ id }) => id === conversation.id)) throw new Error("CLINIC_CONVERSATION_MISSING");

    const clinicMessageResponse = await fetch(`${origin}/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: manager.cookie, Origin: origin },
      body: JSON.stringify({ body: "Merhaba, uygun saatleri birlikte netleştirebiliriz." }),
    });
    requireStatus(clinicMessageResponse, 201, "CLINIC_MESSAGE_SEND");

    const intruderResponse = await fetch(`${origin}/api/conversations/${conversation.id}`, {
      headers: { Cookie: intruder.cookie },
    });
    requireStatus(intruderResponse, 404, "INTRUDER_ACCESS_BLOCK");

    const patientDetailResponse = await fetch(`${origin}/api/conversations/${conversation.id}`, {
      headers: { Cookie: patient.cookie },
    });
    requireStatus(patientDetailResponse, 200, "PATIENT_CONVERSATION_READ");
    const patientDetail = await patientDetailResponse.json() as { messages: Array<{ body: string; mine: boolean }> };
    if (patientDetail.messages.length !== 1 || patientDetail.messages[0].mine) throw new Error("PATIENT_MESSAGE_VIEW_INVALID");

    const patientReplyResponse = await fetch(`${origin}/api/conversations/${conversation.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: patient.cookie, Origin: origin },
      body: JSON.stringify({ body: "Teşekkürler, hafta içi öğleden sonra uygunum." }),
    });
    requireStatus(patientReplyResponse, 201, "PATIENT_MESSAGE_SEND");

    const clinicDetailResponse = await fetch(`${origin}/api/conversations/${conversation.id}`, {
      headers: { Cookie: manager.cookie },
    });
    requireStatus(clinicDetailResponse, 200, "CLINIC_CONVERSATION_READ");
    const messages = await prisma.message.findMany({ where: { conversationId: conversation.id } });
    if (messages.length !== 2 || messages.some((message) => !message.readAt)) throw new Error("MESSAGE_READ_STATE_INVALID");

    const statusResponse = await fetch(`${origin}/api/clinic/appointments/${appointment.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: manager.cookie, Origin: origin },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    requireStatus(statusResponse, 200, "APPOINTMENT_STATUS_UPDATE");
    const patientNotification = await prisma.notification.findFirst({
      where: { userId: patient.user.id, type: "APPOINTMENT_STATUS" },
    });
    if (!patientNotification?.href?.includes(conversation.id)) throw new Error("PATIENT_NOTIFICATION_LINK_INVALID");

    console.log("Messaging lifecycle smoke test passed: request -> access isolation -> two-way messages -> read state -> notification");
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "MESSAGING_SMOKE_TEST_FAILED");
  process.exitCode = 1;
});
