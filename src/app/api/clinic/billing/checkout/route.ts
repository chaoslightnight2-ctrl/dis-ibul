import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { billingCheckoutSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestOrigin } from "@/lib/request-url";
import { getIyzicoPricingPlanReference, initializeIyzicoSubscription, isIyzicoConfigured } from "@/services/billing/iyzico";

function normalizeTurkishPhone(value: string) {
  const digits = value.replaceAll(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return `+90${digits}`;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "billing-checkout", 5);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (!access.user.emailVerified) return NextResponse.json({ error: "EMAIL_VERIFICATION_REQUIRED" }, { status: 403 });

  const payload = billingCheckoutSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { slug: payload.data.planSlug, isActive: true },
  });
  if (!plan) return NextResponse.json({ error: "PLAN_NOT_FOUND" }, { status: 404 });

  const activeSubscription = await prisma.subscription.findFirst({
    where: { clinicId: access.clinic.id, status: { in: ["ACTIVE", "PENDING", "UNPAID"] } },
    include: { plan: { select: { slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  if (activeSubscription?.plan.slug === plan.slug && activeSubscription.status === "ACTIVE") {
    return NextResponse.json({ error: "PLAN_ALREADY_ACTIVE" }, { status: 409 });
  }

  if (Number(plan.monthlyPrice) === 0) {
    if (activeSubscription?.provider === "IYZICO") {
      return NextResponse.json({ error: "PAID_SUBSCRIPTION_MUST_BE_CANCELED_FIRST" }, { status: 409 });
    }
    const subscription = await prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { clinicId: access.clinic.id, status: { in: ["ACTIVE", "PENDING", "UNPAID"] } },
        data: { status: "CANCELED", endsAt: new Date() },
      });
      const created = await tx.subscription.create({
        data: {
          clinicId: access.clinic.id,
          planId: plan.id,
          provider: "INTERNAL",
          status: "ACTIVE",
          currentPeriodStart: new Date(),
        },
      });
      await tx.clinic.update({ where: { id: access.clinic.id }, data: { isSponsored: false } });
      await tx.auditLog.create({
        data: {
          actorId: access.user.id,
          action: "SUBSCRIPTION_FREE_PLAN_ACTIVATED",
          target: `clinic:${access.clinic.id}`,
          metadata: { planSlug: plan.slug, subscriptionId: created.id },
        },
      });
      return created;
    });
    return NextResponse.json({ status: "ACTIVE", subscriptionId: subscription.id });
  }

  if (activeSubscription?.provider === "IYZICO") {
    return NextResponse.json({ error: "ACTIVE_PAID_SUBSCRIPTION_EXISTS" }, { status: 409 });
  }
  if (!isIyzicoConfigured()) return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
  const pricingPlanReferenceCode = getIyzicoPricingPlanReference(plan.slug, plan.iyzicoPricingPlanRefCode);
  if (!pricingPlanReferenceCode) return NextResponse.json({ error: "PLAN_PROVIDER_REFERENCE_MISSING" }, { status: 503 });
  if (!payload.data.identityNumber || !payload.data.gsmNumber || !payload.data.zipCode) {
    return NextResponse.json({ error: "BILLING_DETAILS_REQUIRED" }, { status: 400 });
  }

  const reusableCheckout = await prisma.billingCheckout.findFirst({
    where: {
      clinicId: access.clinic.id,
      planId: plan.id,
      userId: access.user.id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
      checkoutFormContent: { not: null },
    },
    orderBy: { createdAt: "desc" },
  });
  if (reusableCheckout) {
    return NextResponse.json({ checkoutUrl: `/api/billing/iyzico/form/${reusableCheckout.id}` });
  }

  const conversationId = randomUUID();
  const checkout = await prisma.billingCheckout.create({
    data: {
      clinicId: access.clinic.id,
      userId: access.user.id,
      planId: plan.id,
      conversationId,
      status: "INITIALIZING",
    },
  });
  const nameParts = access.user.name.trim().split(/\s+/);
  const firstName = nameParts.shift() || "Klinik";
  const surname = nameParts.join(" ") || "Yetkilisi";
  const address = {
    address: access.clinic.address,
    zipCode: payload.data.zipCode,
    contactName: access.user.name,
    city: access.clinic.city,
    country: "Turkey",
  };

  try {
    const initialized = await initializeIyzicoSubscription({
      callbackUrl: new URL("/api/billing/iyzico/callback", getRequestOrigin(request)).toString(),
      conversationId,
      pricingPlanReferenceCode,
      customer: {
        name: firstName,
        surname,
        email: access.user.email,
        gsmNumber: normalizeTurkishPhone(payload.data.gsmNumber),
        identityNumber: payload.data.identityNumber,
        billingAddress: address,
        shippingAddress: address,
      },
    });
    await prisma.billingCheckout.update({
      where: { id: checkout.id },
      data: {
        token: initialized.token,
        checkoutFormContent: initialized.checkoutFormContent,
        status: "PENDING",
        expiresAt: new Date(Date.now() + initialized.expiresIn * 1_000),
      },
    });
    return NextResponse.json({ checkoutUrl: `/api/billing/iyzico/form/${checkout.id}` }, { status: 201 });
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 120) : "IYZICO_INITIALIZE_FAILED";
    await prisma.billingCheckout.update({ where: { id: checkout.id }, data: { status: "FAILED", failureCode } });
    return NextResponse.json({ error: "BILLING_PROVIDER_ERROR" }, { status: 502 });
  }
}
