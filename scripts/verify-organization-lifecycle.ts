import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const origin = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const managerEmail = `organization-manager-${suffix}@example.test`;
const inviteeEmail = `organization-invitee-${suffix}@example.test`;
const intruderEmail = `organization-intruder-${suffix}@example.test`;

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
  const user = await prisma.user.update({ where: { email }, data: { emailVerified: true, emailVerifiedAt: new Date() } });
  return { cookie, user };
}

async function api(url: string, method: string, cookie: string, body?: unknown) {
  return fetch(`${origin}${url}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), Cookie: cookie, Origin: origin },
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function cleanup() {
  await prisma.clinic.deleteMany({ where: { slug: { startsWith: "organization-test-" } } });
  await prisma.user.deleteMany({ where: { email: { startsWith: "organization-", endsWith: "@example.test" } } });
}

async function main() {
  await cleanup();
  try {
    const manager = await signup("Organization Test Manager", managerEmail);
    const invitee = await signup("Organization Test Dentist", inviteeEmail);
    const intruder = await signup("Organization Test Intruder", intruderEmail);
    await prisma.user.update({ where: { id: manager.user.id }, data: { role: "CLINIC_MANAGER" } });

    const clinic = await prisma.clinic.create({
      data: { slug: `organization-test-${suffix}`, name: "Organization Test Clinic", city: "İstanbul", district: "Kadıköy", address: "Test Mahallesi Test Caddesi No 10", initialExamIncludes: [], languages: ["Türkçe"], paymentOptions: [] },
    });
    const managerMembership = await prisma.clinicTeamMember.create({ data: { clinicId: clinic.id, userId: manager.user.id, role: "CLINIC_MANAGER" } });

    const branchResponse = await api("/api/clinic/branches", "POST", manager.cookie, { name: "Ana Şube", city: "İstanbul", district: "Kadıköy", address: "Caferağa Mahallesi Test Sokak No 12", phone: "+905551112233", email: "sube@example.test", isMain: true });
    requireStatus(branchResponse, 201, "BRANCH_CREATE");
    const branch = await branchResponse.json() as { id: string };
    const branchUpdate = await api(`/api/clinic/branches/${branch.id}`, "PATCH", manager.cookie, { name: "Merkez Şube", city: "İstanbul", district: "Kadıköy", address: "Caferağa Mahallesi Güncel Sokak No 14", phone: "+905551112233", email: "sube@example.test", isMain: true });
    requireStatus(branchUpdate, 200, "BRANCH_UPDATE");

    const dentistResponse = await api("/api/clinic/dentists", "POST", manager.cookie, { fullName: "Dr. Test Hekim", title: "Diş Hekimi", university: "Marmara Üniversitesi", graduationYear: 2018, experienceYears: 8, about: "Test hekim profili açıklaması.", languages: ["Türkçe", "İngilizce"], acceptsChildren: true, acceptsInternationalPatients: false, onlineConsultation: true });
    requireStatus(dentistResponse, 201, "DENTIST_CREATE");
    const dentist = await dentistResponse.json() as { id: string };

    const invitationResponse = await api("/api/clinic/team/invitations", "POST", manager.cookie, { email: inviteeEmail, role: "DENTIST" });
    requireStatus(invitationResponse, 201, "INVITATION_CREATE");
    const invitation = await invitationResponse.json() as { invitationUrl?: string };
    const persistedNotification = invitation.invitationUrl ? null : await prisma.notification.findFirst({
      where: { userId: invitee.user.id, type: "CLINIC_INVITATION" },
      orderBy: { createdAt: "desc" },
      select: { href: true },
    });
    const invitationPath = invitation.invitationUrl ?? persistedNotification?.href;
    if (!invitationPath) throw new Error("INVITATION_DELIVERY_LINK_MISSING");
    const token = invitationPath.split("/").at(-1);
    if (!token) throw new Error("INVITATION_TOKEN_MISSING");

    const wrongAccount = await api(`/api/clinic-invitations/${token}/accept`, "POST", intruder.cookie);
    requireStatus(wrongAccount, 403, "INVITATION_EMAIL_ISOLATION");
    const accepted = await api(`/api/clinic-invitations/${token}/accept`, "POST", invitee.cookie);
    requireStatus(accepted, 200, "INVITATION_ACCEPT");
    const inviteeMembership = await prisma.clinicTeamMember.findUnique({ where: { clinicId_userId: { clinicId: clinic.id, userId: invitee.user.id } } });
    if (inviteeMembership?.role !== "DENTIST") throw new Error("INVITEE_MEMBERSHIP_INVALID");

    const lastManagerDemotion = await api(`/api/clinic/team/${managerMembership.id}`, "PATCH", manager.cookie, { role: "DENTIST" });
    requireStatus(lastManagerDemotion, 409, "LAST_MANAGER_DEMOTION_BLOCK");
    const lastManagerRemoval = await api(`/api/clinic/team/${managerMembership.id}`, "DELETE", manager.cookie);
    requireStatus(lastManagerRemoval, 409, "LAST_MANAGER_REMOVAL_BLOCK");

    const secondaryClinic = await prisma.clinic.create({
      data: { slug: `organization-test-secondary-${suffix}`, name: "Secondary Test Clinic", city: "Ankara", district: "Çankaya", address: "Test Mahallesi İkinci Cadde No 20", initialExamIncludes: [], languages: ["Türkçe"], paymentOptions: [] },
    });
    await prisma.clinicTeamMember.create({ data: { clinicId: secondaryClinic.id, userId: manager.user.id, role: "DENTIST" } });
    const contextResponse = await api("/api/clinic/context", "POST", manager.cookie, { clinicId: secondaryClinic.id });
    requireStatus(contextResponse, 200, "CLINIC_CONTEXT_SWITCH");
    const activeCookie = cookieHeader(contextResponse);
    const unauthorizedManagerAction = await api("/api/clinic/branches", "POST", `${manager.cookie}; ${activeCookie}`, { name: "Yetkisiz Şube", city: "Ankara", district: "Çankaya", address: "Bu işlem oluşturulmamalıdır No 1", phone: "", email: "", isMain: true });
    requireStatus(unauthorizedManagerAction, 401, "MEMBERSHIP_ROLE_ISOLATION");

    requireStatus(await api(`/api/clinic/dentists/${dentist.id}`, "DELETE", manager.cookie), 200, "DENTIST_ARCHIVE");
    requireStatus(await api(`/api/clinic/branches/${branch.id}`, "DELETE", manager.cookie), 200, "BRANCH_ARCHIVE");
    const [archivedBranch, archivedDentist] = await Promise.all([
      prisma.clinicBranch.findUniqueOrThrow({ where: { id: branch.id } }),
      prisma.dentist.findUniqueOrThrow({ where: { id: dentist.id } }),
    ]);
    if (archivedBranch.isActive || archivedDentist.isActive) throw new Error("ARCHIVE_STATE_INVALID");

    console.log("Organization lifecycle smoke test passed: CRUD -> invite isolation -> role guards -> multi-clinic permission -> archive");
  } finally {
    await cleanup();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "ORGANIZATION_SMOKE_TEST_FAILED");
  process.exitCode = 1;
});
