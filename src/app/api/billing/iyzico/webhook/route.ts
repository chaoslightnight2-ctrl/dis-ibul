import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { verifyIyzicoSubscriptionWebhook } from "@/services/billing/iyzico";

const webhookSchema = z.object({
  merchantId: z.union([z.string().min(1), z.number().int().positive()]),
  orderReferenceCode: z.string().min(1).max(160),
  customerReferenceCode: z.string().min(1).max(160),
  subscriptionReferenceCode: z.string().min(1).max(160),
  iyziReferenceCode: z.string().min(1).max(160),
  iyziEventType: z.string().min(1).max(120),
  iyziEventTime: z.number().int().positive(),
});

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "iyzico-webhook", 100);
  if (blocked) return blocked;
  const payload = webhookSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "INVALID_WEBHOOK" }, { status: 400 });
  if (String(payload.data.merchantId) !== process.env.IYZICO_MERCHANT_ID) {
    return NextResponse.json({ error: "INVALID_MERCHANT" }, { status: 401 });
  }
  if (!verifyIyzicoSubscriptionWebhook(payload.data, request.headers.get("x-iyz-signature-v3"))) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const eventKey = { provider_providerEventId: { provider: "IYZICO", providerEventId: payload.data.iyziReferenceCode } };
  const existing = await prisma.billingWebhookEvent.findUnique({ where: eventKey, select: { id: true } });
  if (existing) return new Response(null, { status: 204 });

  const event = await prisma.billingWebhookEvent.create({
    data: {
      provider: "IYZICO",
      providerEventId: payload.data.iyziReferenceCode,
      eventType: payload.data.iyziEventType,
      subscriptionRef: payload.data.subscriptionReferenceCode,
      orderRef: payload.data.orderReferenceCode,
      customerRef: payload.data.customerReferenceCode,
    },
  }).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return null;
    throw error;
  });
  if (!event) return new Response(null, { status: 204 });

  try {
    const subscription = await prisma.subscription.findUnique({
      where: { providerSubscriptionId: payload.data.subscriptionReferenceCode },
      include: { plan: { select: { monthlyPrice: true, currency: true } } },
    });
    if (!subscription) {
      await prisma.billingWebhookEvent.update({
        where: { id: event.id },
        data: { status: "IGNORED", processedAt: new Date(), processingError: "SUBSCRIPTION_NOT_FOUND" },
      });
      return new Response(null, { status: 204 });
    }

    const success = payload.data.iyziEventType === "subscription.order.success";
    const failure = payload.data.iyziEventType === "subscription.order.failure";
    const eventTime = payload.data.iyziEventTime < 10_000_000_000
      ? new Date(payload.data.iyziEventTime * 1_000)
      : new Date(payload.data.iyziEventTime);
    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscription.id },
        data: success ? { status: "ACTIVE" } : failure ? { status: "UNPAID" } : {},
      });
      if (success || failure) {
        await tx.clinic.update({
          where: { id: subscription.clinicId },
          data: { isSponsored: success },
        });
      }
      if (success || failure) {
        await tx.payment.upsert({
          where: { providerPaymentId: payload.data.orderReferenceCode },
          update: {
            status: success ? "PAID" : "FAILED",
            failureCode: failure ? payload.data.iyziEventType : null,
            paidAt: success ? eventTime : null,
          },
          create: {
            subscriptionId: subscription.id,
            providerPaymentId: payload.data.orderReferenceCode,
            amount: subscription.plan.monthlyPrice,
            currency: subscription.plan.currency,
            status: success ? "PAID" : "FAILED",
            failureCode: failure ? payload.data.iyziEventType : null,
            paidAt: success ? eventTime : null,
          },
        });
      }
      await tx.billingWebhookEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSED", processedAt: new Date() },
      });
    });
    return new Response(null, { status: 204 });
  } catch {
    await prisma.billingWebhookEvent.update({
      where: { id: event.id },
      data: { status: "FAILED", processedAt: new Date(), processingError: "PROCESSING_FAILED" },
    });
    return NextResponse.json({ error: "WEBHOOK_PROCESSING_FAILED" }, { status: 500 });
  }
}
