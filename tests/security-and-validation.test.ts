import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clinicApplicationDecisionSchema,
  clinicPriceSchema,
  clinicProfileUpdateSchema,
  clinicTreatmentCapabilitySchema,
  quoteRequestSchema,
} from "../src/domain/validation";
import { guardMutation } from "../src/lib/request-security";
import { getRequestOrigin } from "../src/lib/request-url";
import { toSlug } from "../src/lib/slug";
afterEach(() => vi.unstubAllEnvs());

describe("write request security", () => {
  it("rejects cross-origin mutations", async () => {
    const request = new Request("https://discibul.example/api/profile", {
      method: "POST",
      headers: { origin: "https://attacker.example" },
    });

    expect((await guardMutation(request, "cross-origin-test"))?.status).toBe(403);
  });

  it("accepts the browser origin when Next.js uses an internal host", async () => {
    const request = new Request("http://localhost:3000/api/profile", {
      method: "POST",
      headers: {
        host: "127.0.0.1:3000",
        origin: "http://127.0.0.1:3000",
      },
    });

    expect(await guardMutation(request, "local-proxy-origin-test")).toBeNull();
  });

  it("accepts an HTTPS origin forwarded by the public tunnel", async () => {
    const request = new Request("http://localhost:3000/api/profile", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://discibul.example",
        "x-forwarded-host": "discibul.example",
        "x-forwarded-proto": "https",
      },
    });

    expect(await guardMutation(request, "public-proxy-origin-test")).toBeNull();
  });

  it("limits repeated mutations per scope and ip", async () => {
    const createRequest = () => new Request("https://discibul.example/api/test", {
      method: "POST",
      headers: { origin: "https://discibul.example", "x-forwarded-for": "203.0.113.8" },
    });

    expect(await guardMutation(createRequest(), "rate-limit-test", 1)).toBeNull();
    expect((await guardMutation(createRequest(), "rate-limit-test", 1))?.status).toBe(429);
  });

  it("uses the configured HTTPS origin for production callbacks", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://discibul.example/app");
    const request = new Request("http://internal:3000/api/billing", {
      headers: { "x-forwarded-host": "attacker.example", "x-forwarded-proto": "https" },
    });

    expect(getRequestOrigin(request)).toBe("https://discibul.example");
  });

  it("rejects a spoofed forwarded origin in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "https://discibul.example");
    const request = new Request("http://internal:3000/api/profile", {
      method: "POST",
      headers: {
        origin: "https://attacker.example",
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
    });

    expect((await guardMutation(request, "production-origin-test"))?.status).toBe(403);
  });
});

describe("public input normalization", () => {
  it("creates stable Turkish slugs", () => {
    expect(toSlug("İzmir Gülüş & Diş Kliniği")).toBe("izmir-gulus-dis-klinigi");
  });

  it("requires patient contact and explicit health consent for quotes", () => {
    const result = quoteRequestSchema.safeParse({
      clinicSlugs: ["mavi-gulus-klinigi"],
      treatmentName: "Tek diş implantı",
      complaint: "İmplant için değerlendirme istiyorum.",
      city: "İstanbul",
      contactPreference: "phone",
      kvkkConsent: true,
      healthDataConsent: true,
    });

    expect(result.success).toBe(false);
  });
});

describe("clinic publishing validation", () => {
  it("requires an exam fee when the initial exam is not free", () => {
    const result = clinicProfileUpdateSchema.safeParse({
      name: "Startup Diş Kliniği",
      description: "",
      foundingYear: null,
      city: "İstanbul",
      district: "Kadıköy",
      neighborhood: "Kozyatağı",
      address: "Kozyatağı Mahallesi Test Caddesi No:10",
      phone: "05550000000",
      whatsapp: "",
      email: "klinik@example.com",
      website: "",
      freeInitialExam: false,
      firstExamFee: null,
      initialExamIncludes: [],
      languages: ["Türkçe"],
      paymentOptions: [],
      emergencyService: false,
      wheelchairAccess: true,
      parking: false,
      onlineConsultation: true,
      childFriendly: false,
      sedation: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an inverted treatment price range", () => {
    const result = clinicPriceSchema.safeParse({
      treatmentSlug: "tek-dis-implanti",
      pricingMode: "range",
      fixedPrice: null,
      minPrice: 20_000,
      maxPrice: 10_000,
      currency: "TRY",
      priceUnit: "diş başına",
      vatIncluded: true,
      examIncluded: false,
      imagingIncluded: false,
      packageContent: "",
      extraFeeConditions: "",
    });

    expect(result.success).toBe(false);
  });

  it("requires a note for a negative moderation decision", () => {
    expect(clinicApplicationDecisionSchema.safeParse({ decision: "REJECTED" }).success).toBe(false);
    expect(clinicApplicationDecisionSchema.safeParse({ decision: "VERIFIED" }).success).toBe(true);
  });

  it("accepts only explicit clinic treatment capability states", () => {
    expect(clinicTreatmentCapabilitySchema.safeParse({ treatmentSlug: "implant", availability: "OFFERED" }).success).toBe(true);
    expect(clinicTreatmentCapabilitySchema.safeParse({ treatmentSlug: "implant", availability: "NOT_OFFERED" }).success).toBe(true);
    expect(clinicTreatmentCapabilitySchema.safeParse({ treatmentSlug: "implant", availability: "UNKNOWN" }).success).toBe(true);
    expect(clinicTreatmentCapabilitySchema.safeParse({ treatmentSlug: "implant", availability: "MAYBE" }).success).toBe(false);
  });
});
