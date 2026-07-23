import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { getRequestOrigin } from "@/lib/request-url";
import { getIyzicoPricingPlanReference, retrieveIyzicoSubscription } from "@/services/billing/iyzico";

function fromEpoch(value: number | undefined) {
  return value ? new Date(value) : undefined;
}

async function readToken(request: Request) {
  try {
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json() as { token?: unknown };
      return typeof body.token === "string" ? body.token : null;
    }
    const body = await request.formData();
    const token = body.get("token");
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "iyzico-callback", 30);
  if (blocked) return blocked;
  const origin = getRequestOrigin(request);
  const failureUrl = new URL("/panel/klinik/abonelik?durum=odeme-hatasi", origin);
  const successUrl = new URL("/panel/klinik/abonelik?durum=aktif", origin);
  const token = await readToken(request);
  if (!token) return NextResponse.redirect(failureUrl, 303);

  const checkout = await prisma.billingCheckout.findUnique({
    where: { token },
    include: { plan: true },
  });
  if (!checkout) return NextResponse.redirect(failureUrl, 303);
  if (checkout.status === "COMPLETED") return NextResponse.redirect(successUrl, 303);

  try {
    const result = await retrieveIyzicoSubscription(token);
    const providerSubscription = result.subscription;
    if (result.conversationId && result.conversationId !== checkout.conversationId) throw new Error("IYZICO_CONVERSATION_MISMATCH");
    const expectedPlanReference = getIyzicoPricingPlanReference(checkout.plan.slug, checkout.plan.iyzicoPricingPlanRefCode);
    if (!expectedPlanReference || providerSubscription.pricingPlanReferenceCode !== expectedPlanReference) throw new Error("IYZICO_PLAN_MISMATCH");

    await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          clinicId: checkout.clinicId,
          providerSubscriptionId: { not: providerSubscription.referenceCode },
          status: { in: ["ACTIVE", "PENDING", "UNPAID"] },
        },
        data: { status: "UPGRADED", endsAt: new Date() },
      });
      await tx.subscription.upsert({
        where: { providerSubscriptionId: providerSubscription.referenceCode },
        update: {
          planId: checkout.planId,
          status: providerSubscription.subscriptionStatus,
          providerCustomerId: providerSubscription.customerReferenceCode,
          currentPeriodStart: fromEpoch(providerSubscription.startDate),
          currentPeriodEnd: fromEpoch(providerSubscription.endDate),
          endsAt: fromEpoch(providerSubscription.endDate),
        },
        create: {
          clinicId: checkout.clinicId,
          planId: checkout.planId,
          provider: "IYZICO",
          providerSubscriptionId: providerSubscription.referenceCode,
          providerCustomerId: providerSubscription.customerReferenceCode,
          status: providerSubscription.subscriptionStatus,
          startsAt: fromEpoch(providerSubscription.startDate) ?? new Date(),
          endsAt: fromEpoch(providerSubscription.endDate),
          currentPeriodStart: fromEpoch(providerSubscription.startDate),
          currentPeriodEnd: fromEpoch(providerSubscription.endDate),
        },
      });
      await tx.clinic.update({ where: { id: checkout.clinicId }, data: { isSponsored: true } });
      await tx.billingCheckout.update({
        where: { id: checkout.id },
        data: {
          status: "COMPLETED",
          providerSubscriptionId: providerSubscription.referenceCode,
          checkoutFormContent: null,
          completedAt: new Date(),
          failureCode: null,
        },
      });
      await tx.auditLog.create({
        data: {
          actorId: checkout.userId,
          action: "SUBSCRIPTION_ACTIVATED",
          target: `clinic:${checkout.clinicId}`,
          metadata: { planId: checkout.planId, provider: "IYZICO" },
        },
      });
    });
    return NextResponse.redirect(successUrl, 303);
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 120) : "IYZICO_RETRIEVE_FAILED";
    await prisma.billingCheckout.update({ where: { id: checkout.id }, data: { status: "FAILED", failureCode } });
    return NextResponse.redirect(failureUrl, 303);
  }
}
