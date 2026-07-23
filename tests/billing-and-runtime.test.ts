import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { billingCancellationSchema, billingCheckoutSchema } from "../src/domain/validation";
import { validateRuntimeEnvironment } from "../src/lib/runtime-env";
import {
  createIyzicoAuthorization,
  verifyIyzicoSubscriptionWebhook,
  type IyzicoSubscriptionWebhook,
} from "../src/services/billing/iyzico";

afterEach(() => vi.unstubAllEnvs());

describe("iyzico billing security", () => {
  it("creates the documented IYZWSv2 HMAC authorization payload", () => {
    const path = "/v2/subscription/checkoutform/initialize";
    const body = JSON.stringify({ locale: "tr", conversationId: "conv-1" });
    const randomKey = "random-123";
    const signature = createHmac("sha256", "secret-key")
      .update(`${randomKey}${path}${body}`)
      .digest("hex");

    const authorization = createIyzicoAuthorization(path, body, randomKey, "api-key", "secret-key");
    expect(authorization.startsWith("IYZWSv2 ")).toBe(true);
    expect(Buffer.from(authorization.slice(8), "base64").toString("utf8"))
      .toBe(`apiKey:api-key&randomKey:${randomKey}&signature:${signature}`);
  });

  it("accepts a valid V3 webhook signature and rejects a forged one", () => {
    vi.stubEnv("IYZICO_SECRET_KEY", "webhook-secret");
    const payload: IyzicoSubscriptionWebhook = {
      merchantId: 12345,
      iyziEventType: "subscription.order.success",
      subscriptionReferenceCode: "subscription-1",
      orderReferenceCode: "order-1",
      customerReferenceCode: "customer-1",
      iyziReferenceCode: "event-1",
      iyziEventTime: 1_784_050_000_000,
    };
    const message = `webhook-secret${payload.merchantId}${payload.iyziEventType}${payload.subscriptionReferenceCode}${payload.orderReferenceCode}${payload.customerReferenceCode}`;
    const signature = createHmac("sha256", "webhook-secret").update(message).digest("hex");

    expect(verifyIyzicoSubscriptionWebhook(payload, signature)).toBe(true);
    expect(verifyIyzicoSubscriptionWebhook(payload, "0".repeat(64))).toBe(false);
    expect(verifyIyzicoSubscriptionWebhook(payload, null)).toBe(false);
  });
});

describe("billing input validation", () => {
  it("requires explicit recurring billing consent", () => {
    expect(billingCheckoutSchema.safeParse({ planSlug: "buyume", termsAccepted: false }).success).toBe(false);
    expect(billingCheckoutSchema.safeParse({ planSlug: "buyume", termsAccepted: true }).success).toBe(true);
  });

  it("accepts only an explicit cancellation confirmation", () => {
    expect(billingCancellationSchema.safeParse({ confirmed: true }).success).toBe(true);
    expect(billingCancellationSchema.safeParse({ confirmed: false }).success).toBe(false);
  });
});

describe("production environment readiness", () => {
  it("reports missing production dependencies without exposing secret values", () => {
    const result = validateRuntimeEnvironment({ NODE_ENV: "production" });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "DATABASE_URL_INVALID",
      "BETTER_AUTH_SECRET_WEAK",
      "REDIS_URL_INVALID",
      "APP_BASE_URL_MUST_BE_HTTPS",
    ]));
  });

  it("accepts a complete production environment with optional providers disabled", () => {
    const result = validateRuntimeEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      REDIS_URL: "rediss://cache.example.com:6379",
      BETTER_AUTH_SECRET: "a".repeat(48),
      APP_BASE_URL: "https://discibul.example",
      AUTH_ALLOWED_HOSTS: "discibul.example",
      EMAIL_PROVIDER: "disabled",
      GOOGLE_PROVIDER: "mock",
      BILLING_PROVIDER: "disabled",
    });
    expect(result.ok).toBe(true);
    expect(result.issues.map((issue) => issue.code)).not.toContain("GOOGLE_PROVIDER_IS_MOCK");
  });

  it("requires a server-side API key when Google Places is enabled", () => {
    const result = validateRuntimeEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      REDIS_URL: "rediss://cache.example.com:6379",
      BETTER_AUTH_SECRET: "a".repeat(48),
      APP_BASE_URL: "https://discibul.example",
      AUTH_ALLOWED_HOSTS: "discibul.example",
      EMAIL_PROVIDER: "disabled",
      GOOGLE_PROVIDER: "google",
      BILLING_PROVIDER: "disabled",
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("GOOGLE_MAPS_API_KEY_MISSING");
  });

  it("rejects a Google monthly budget above the documented free-use cap", () => {
    const result = validateRuntimeEnvironment({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      BETTER_AUTH_SECRET: "a".repeat(48),
      GOOGLE_PROVIDER: "mock",
      GOOGLE_PLACES_MAX_REQUESTS_PER_MONTH: "1001",
    });
    expect(result.issues.map((issue) => issue.code)).toContain("GOOGLE_PLACES_MONTHLY_BUDGET_INVALID");
  });

  it("requires a complete Google Business OAuth configuration and a 32-byte encryption key", () => {
    const incomplete = validateRuntimeEnvironment({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      BETTER_AUTH_SECRET: "a".repeat(48),
      APP_BASE_URL: "http://localhost:3000",
      GOOGLE_BUSINESS_CLIENT_ID: "client-id",
    });
    expect(incomplete.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "GOOGLE_BUSINESS_CONFIGURATION_INCOMPLETE",
      "GOOGLE_BUSINESS_ENCRYPTION_KEY_INVALID",
    ]));

    const complete = validateRuntimeEnvironment({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      BETTER_AUTH_SECRET: "a".repeat(48),
      APP_BASE_URL: "http://localhost:3000",
      GOOGLE_BUSINESS_CLIENT_ID: "client-id",
      GOOGLE_BUSINESS_CLIENT_SECRET: "client-secret",
      GOOGLE_BUSINESS_TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString("base64"),
    });
    expect(complete.issues.map((issue) => issue.code)).not.toContain("GOOGLE_BUSINESS_CONFIGURATION_INCOMPLETE");
    expect(complete.issues.map((issue) => issue.code)).not.toContain("GOOGLE_BUSINESS_ENCRYPTION_KEY_INVALID");
  });

  it("rejects insecure OpenStreetMap service endpoints", () => {
    const result = validateRuntimeEnvironment({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      BETTER_AUTH_SECRET: "a".repeat(48),
      OSM_NOMINATIM_URL: "http://example.com/search",
      OSM_OVERPASS_URL: "not-a-url",
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "OSM_NOMINATIM_URL_INVALID",
      "OSM_OVERPASS_URL_INVALID",
    ]));
  });

  it("rejects private file storage without a production scanner", () => {
    const result = validateRuntimeEnvironment({
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://user:password@db:5432/discibul",
      REDIS_URL: "rediss://cache.example.com:6379",
      BETTER_AUTH_SECRET: "a".repeat(48),
      APP_BASE_URL: "https://discibul.example",
      AUTH_ALLOWED_HOSTS: "discibul.example",
      EMAIL_PROVIDER: "disabled",
      GOOGLE_PROVIDER: "mock",
      BILLING_PROVIDER: "disabled",
      OBJECT_STORAGE_PROVIDER: "s3",
      S3_BUCKET: "private-files",
      S3_ACCESS_KEY_ID: "key",
      S3_SECRET_ACCESS_KEY: "secret",
      FILE_SCAN_PROVIDER: "disabled",
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("PRIVATE_FILE_SCANNER_REQUIRED");
  });
});
