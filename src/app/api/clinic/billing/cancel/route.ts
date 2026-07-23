import { NextResponse } from "next/server";
import { billingCancellationSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { cancelIyzicoSubscription, isIyzicoConfigured } from "@/services/billing/iyzico";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "billing-cancel", 3);
  if (blocked) return blocked;

  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const payload = billingCancellationSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "CONFIRMATION_REQUIRED" }, { status: 400 });

  const subscription = await prisma.subscription.findFirst({
    where: {
      clinicId: access.clinic.id,
      status: { in: ["ACTIVE", "PENDING", "UNPAID"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (!subscription) return NextResponse.json({ error: "ACTIVE_SUBSCRIPTION_NOT_FOUND" }, { status: 404 });

  if (subscription.provider === "IYZICO") {
    if (!subscription.providerSubscriptionId) {
      return NextResponse.json({ error: "PROVIDER_SUBSCRIPTION_MISSING" }, { status: 409 });
    }
    if (!isIyzicoConfigured()) {
      return NextResponse.json({ error: "BILLING_NOT_CONFIGURED" }, { status: 503 });
    }
    try {
      await cancelIyzicoSubscription(subscription.providerSubscriptionId);
    } catch {
      return NextResponse.json({ error: "BILLING_PROVIDER_ERROR" }, { status: 502 });
    }
  }

  const canceledAt = new Date();
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: false,
        endsAt: canceledAt,
        currentPeriodEnd: canceledAt,
      },
    }),
    prisma.clinic.update({ where: { id: access.clinic.id }, data: { isSponsored: false } }),
    prisma.auditLog.create({
      data: {
        actorId: access.user.id,
        action: "SUBSCRIPTION_CANCELED",
        target: `subscription:${subscription.id}`,
        metadata: { clinicId: access.clinic.id, provider: subscription.provider },
      },
    }),
  ]);

  return NextResponse.json({ status: "CANCELED" });
}
