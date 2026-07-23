import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const origin = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";
const suffix = process.env.SMOKE_FIXTURE_SUFFIX || randomUUID().replaceAll("-", "").slice(0, 10);
const email = `billing-${suffix}@example.test`;
const slug = `billing-test-${suffix}`;

function requireStatus(response: Response, expected: number, operation: string) {
  if (response.status !== expected) {
    throw new Error(`${operation}_FAILED:${response.status}`);
  }
}

function cookieHeader(response: Response) {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.() ?? [response.headers.get("set-cookie") ?? ""];
  return cookies.filter(Boolean).map((value) => value.split(";", 1)[0]).join("; ");
}

async function cleanupSyntheticData(targetEmail = email, targetSlug = slug) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: targetSlug },
    include: { subscriptions: { select: { id: true } } },
  });
  if (clinic) {
    await prisma.auditLog.deleteMany({
      where: {
        target: {
          in: [
            `clinic:${clinic.id}`,
            ...clinic.subscriptions.map((subscription) => `subscription:${subscription.id}`),
          ],
        },
      },
    });
    await prisma.clinic.delete({ where: { id: clinic.id } });
  }
  const user = await prisma.user.findUnique({ where: { email: targetEmail }, select: { id: true } });
  if (user) await prisma.user.delete({ where: { id: user.id } });
}

async function removeStaleSyntheticUsers() {
  const users = await prisma.user.findMany({
    where: { email: { startsWith: "billing-", endsWith: "@example.test" } },
    select: { email: true },
  });
  for (const user of users) {
    await cleanupSyntheticData(user.email, user.email.replace("@example.test", "").replace("billing-", "billing-test-"));
  }
}

async function main() {
  await removeStaleSyntheticUsers();
  let clinicId: string | null = null;
  try {
    const signup = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: origin },
      body: JSON.stringify({ name: "Billing Test Manager", email, password: "Test-Password-2026!" }),
    });
    requireStatus(signup, 200, "SIGNUP");
    const cookie = cookieHeader(signup);
    if (!cookie) throw new Error("SIGNUP_COOKIE_MISSING");

    const user = await prisma.user.update({
      where: { email },
      data: { role: "CLINIC_MANAGER", emailVerified: true, emailVerifiedAt: new Date() },
    });
    const clinic = await prisma.clinic.create({
      data: {
        slug,
        name: "Billing Test Clinic",
        city: "Istanbul",
        district: "Kadikoy",
        address: "Test Mahallesi Test Caddesi No 10",
        initialExamIncludes: [],
        languages: ["Turkce"],
        paymentOptions: [],
      },
    });
    clinicId = clinic.id;
    await prisma.clinicTeamMember.create({
      data: { userId: user.id, clinicId: clinic.id, role: "CLINIC_MANAGER" },
    });

    const activation = await fetch(`${origin}/api/clinic/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: origin },
      body: JSON.stringify({ planSlug: "baslangic", termsAccepted: true }),
    });
    requireStatus(activation, 200, "ACTIVATION");

    const cancellation = await fetch(`${origin}/api/clinic/billing/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: origin },
      body: JSON.stringify({ confirmed: true }),
    });
    requireStatus(cancellation, 200, "CANCELLATION");

    const subscriptions = await prisma.subscription.findMany({
      where: { clinicId },
      select: { provider: true, status: true, plan: { select: { slug: true } } },
    });
    if (subscriptions.length !== 1 || subscriptions[0].provider !== "INTERNAL" || subscriptions[0].status !== "CANCELED" || subscriptions[0].plan.slug !== "baslangic") {
      throw new Error(`SUBSCRIPTION_STATE_INVALID:${JSON.stringify(subscriptions)}`);
    }
    const clinicState = await prisma.clinic.findUniqueOrThrow({ where: { id: clinicId }, select: { isSponsored: true } });
    if (clinicState.isSponsored) throw new Error("FREE_PLAN_SPONSORSHIP_INVALID");
    console.log("Billing lifecycle smoke test passed: signup -> free plan -> cancellation -> cleanup");
    const holdMs = Math.min(Number(process.env.SMOKE_HOLD_MS || 0), 300_000);
    if (holdMs > 0) {
      console.log(`Browser fixture ready: ${email}`);
      await new Promise((resolve) => setTimeout(resolve, holdMs));
    }
  } finally {
    await cleanupSyntheticData();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "BILLING_SMOKE_TEST_FAILED");
  process.exitCode = 1;
});
