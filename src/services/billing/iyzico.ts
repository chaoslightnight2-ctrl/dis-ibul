import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const INITIALIZE_PATH = "/v2/subscription/checkoutform/initialize";

type BillingAddress = {
  address: string;
  zipCode?: string;
  contactName: string;
  city: string;
  country: string;
};

export type IyzicoCustomer = {
  name: string;
  surname: string;
  email: string;
  gsmNumber: string;
  identityNumber: string;
  billingAddress: BillingAddress;
  shippingAddress: BillingAddress;
};

type IyzicoResponse<T> = {
  status?: "success" | "failure";
  errorCode?: string;
  conversationId?: string;
  token?: string;
  checkoutFormContent?: string;
  tokenExpireTime?: number;
  data?: T;
};

export type IyzicoSubscriptionResult = {
  referenceCode?: string;
  parentReferenceCode?: string;
  pricingPlanReferenceCode?: string;
  customerReferenceCode?: string;
  subscriptionStatus?: string;
  trialStartDate?: number;
  trialEndDate?: number;
  startDate?: number;
  endDate?: number;
};

export type ConfirmedIyzicoSubscriptionResult = IyzicoSubscriptionResult & {
  referenceCode: string;
  subscriptionStatus: string;
};

export type IyzicoSubscriptionWebhook = {
  merchantId: number | string;
  orderReferenceCode: string;
  customerReferenceCode: string;
  subscriptionReferenceCode: string;
  iyziReferenceCode: string;
  iyziEventType: "subscription.order.success" | "subscription.order.failure" | string;
  iyziEventTime: number;
};

function configuration() {
  const apiKey = process.env.IYZICO_API_KEY;
  const secretKey = process.env.IYZICO_SECRET_KEY;
  const baseUrl = process.env.IYZICO_API_BASE_URL || "https://sandbox-api.iyzipay.com";
  if (!apiKey || !secretKey) throw new Error("IYZICO_CONFIGURATION_MISSING");

  const parsedBaseUrl = new URL(baseUrl);
  if (!["api.iyzipay.com", "sandbox-api.iyzipay.com"].includes(parsedBaseUrl.hostname)) {
    throw new Error("IYZICO_BASE_URL_INVALID");
  }
  return { apiKey, secretKey, baseUrl: parsedBaseUrl.origin };
}

export function isIyzicoConfigured() {
  return process.env.BILLING_PROVIDER === "iyzico"
    && Boolean(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY && process.env.IYZICO_MERCHANT_ID);
}

export function getIyzicoPricingPlanReference(planSlug: string, storedReference?: string | null) {
  if (storedReference) return storedReference;
  if (planSlug === "buyume") return process.env.IYZICO_PLAN_GROWTH_REF || null;
  if (planSlug === "profesyonel") return process.env.IYZICO_PLAN_PRO_REF || null;
  return null;
}

export function createIyzicoAuthorization(path: string, body: string, randomKey: string, apiKey: string, secretKey: string) {
  const signature = createHmac("sha256", secretKey).update(`${randomKey}${path}${body}`).digest("hex");
  const encoded = Buffer.from(`apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`, "utf8").toString("base64");
  return `IYZWSv2 ${encoded}`;
}

async function requestIyzico<T>(path: string, options: { method: "GET" | "POST"; body?: unknown }) {
  const { apiKey, secretKey, baseUrl } = configuration();
  const body = options.body ? JSON.stringify(options.body) : "";
  const randomKey = `${Date.now()}${randomUUID().replaceAll("-", "")}`;
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      Authorization: createIyzicoAuthorization(path, body, randomKey, apiKey, secretKey),
      "Content-Type": "application/json",
      "x-iyzi-rnd": randomKey,
    },
    body: options.method === "POST" ? body : undefined,
    signal: AbortSignal.timeout(10_000),
  });
  const result = await response.json().catch(() => null) as IyzicoResponse<T> | null;
  if (!response.ok || !result || result.status !== "success") {
    throw new Error(result?.errorCode ? `IYZICO_${result.errorCode}` : `IYZICO_HTTP_${response.status}`);
  }
  return result;
}

export async function initializeIyzicoSubscription(input: {
  callbackUrl: string;
  conversationId: string;
  pricingPlanReferenceCode: string;
  customer: IyzicoCustomer;
}) {
  const response = await requestIyzico<never>(INITIALIZE_PATH, {
    method: "POST",
    body: {
      locale: "tr",
      callbackUrl: input.callbackUrl,
      pricingPlanReferenceCode: input.pricingPlanReferenceCode,
      subscriptionInitialStatus: "ACTIVE",
      conversationId: input.conversationId,
      customer: input.customer,
    },
  });
  if (!response.token || !response.checkoutFormContent) throw new Error("IYZICO_CHECKOUT_RESPONSE_INVALID");
  return {
    token: response.token,
    checkoutFormContent: response.checkoutFormContent,
    expiresIn: response.tokenExpireTime ?? 1_800,
  };
}

export async function retrieveIyzicoSubscription(token: string) {
  const response = await requestIyzico<IyzicoSubscriptionResult>(`/v2/subscription/checkoutform/${encodeURIComponent(token)}`, { method: "GET" });
  if (!response.data?.referenceCode || !response.data.subscriptionStatus) throw new Error("IYZICO_RETRIEVE_RESPONSE_INVALID");
  return {
    conversationId: response.conversationId,
    subscription: response.data as ConfirmedIyzicoSubscriptionResult,
  };
}

export async function cancelIyzicoSubscription(subscriptionReferenceCode: string) {
  await requestIyzico<never>(`/v2/subscription/subscriptions/${encodeURIComponent(subscriptionReferenceCode)}/cancel`, {
    method: "POST",
    body: { subscriptionReferenceCode },
  });
}

export function verifyIyzicoSubscriptionWebhook(payload: IyzicoSubscriptionWebhook, signature: string | null) {
  const secretKey = process.env.IYZICO_SECRET_KEY;
  if (!secretKey || !signature) return false;
  const message = `${secretKey}${payload.merchantId}${payload.iyziEventType}${payload.subscriptionReferenceCode}${payload.orderReferenceCode}${payload.customerReferenceCode}`;
  const expected = createHmac("sha256", secretKey).update(message).digest("hex");
  const actualBuffer = Buffer.from(signature.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
