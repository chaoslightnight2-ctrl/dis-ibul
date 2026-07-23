export type RuntimeEnvironmentIssue = {
  code: string;
  severity: "error" | "warning";
};

function isUrl(value: string | undefined, protocols: string[]) {
  if (!value) return false;
  try {
    return protocols.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function validateRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const issues: RuntimeEnvironmentIssue[] = [];
  const production = env.NODE_ENV === "production";
  const add = (code: string, severity: RuntimeEnvironmentIssue["severity"] = "error") => issues.push({ code, severity });

  if (!isUrl(env.DATABASE_URL, ["postgres:", "postgresql:"])) add("DATABASE_URL_INVALID");
  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) add("BETTER_AUTH_SECRET_WEAK");
  if (production && !isUrl(env.REDIS_URL, ["redis:", "rediss:"])) add("REDIS_URL_INVALID");
  if (!production && env.REDIS_URL && !isUrl(env.REDIS_URL, ["redis:", "rediss:"])) add("REDIS_URL_INVALID");

  if (production) {
    if (!isUrl(env.APP_BASE_URL, ["https:"])) add("APP_BASE_URL_MUST_BE_HTTPS");
    if (!env.AUTH_ALLOWED_HOSTS?.trim()) add("AUTH_ALLOWED_HOSTS_REQUIRED");
    if (!env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY) add("SERVER_ACTIONS_KEY_REQUIRED", "warning");
  }

  const emailProvider = (env.EMAIL_PROVIDER || "mock").toLowerCase();
  if (!["disabled", "mock", "resend"].includes(emailProvider)) add("EMAIL_PROVIDER_UNSUPPORTED");
  if (emailProvider === "resend" && (!env.RESEND_API_KEY || !env.EMAIL_FROM)) add("RESEND_CONFIGURATION_MISSING");
  if (env.EMAIL_REQUIRE_VERIFICATION === "true" && emailProvider !== "resend") add("EMAIL_VERIFICATION_REQUIRES_RESEND");
  if (production && emailProvider === "mock") add("EMAIL_PROVIDER_IS_MOCK", "warning");

  const googleProvider = (env.GOOGLE_PROVIDER || "mock").toLowerCase();
  if (!["mock", "google"].includes(googleProvider)) add("GOOGLE_PROVIDER_UNSUPPORTED");
  if (googleProvider === "google" && !env.GOOGLE_MAPS_API_KEY) add("GOOGLE_MAPS_API_KEY_MISSING");
  const googlePageSize = Number(env.GOOGLE_PLACES_PAGE_SIZE || "20");
  if (!Number.isInteger(googlePageSize) || googlePageSize < 1 || googlePageSize > 20) add("GOOGLE_PLACES_PAGE_SIZE_INVALID");
  const googleTimeout = Number(env.GOOGLE_PLACES_TIMEOUT_MS || "8000");
  if (!Number.isInteger(googleTimeout) || googleTimeout < 1000 || googleTimeout > 20000) add("GOOGLE_PLACES_TIMEOUT_INVALID");
  const googleMonthlyBudget = Number(env.GOOGLE_PLACES_MAX_REQUESTS_PER_MONTH || "900");
  if (!Number.isInteger(googleMonthlyBudget) || googleMonthlyBudget < 1 || googleMonthlyBudget > 1000) add("GOOGLE_PLACES_MONTHLY_BUDGET_INVALID");
  const googleMinuteBudget = Number(env.GOOGLE_PLACES_MAX_REQUESTS_PER_MINUTE || "90");
  if (!Number.isInteger(googleMinuteBudget) || googleMinuteBudget < 1 || googleMinuteBudget > 1000) add("GOOGLE_PLACES_MINUTE_BUDGET_INVALID");

  const googleBusinessValues = [
    env.GOOGLE_BUSINESS_CLIENT_ID,
    env.GOOGLE_BUSINESS_CLIENT_SECRET,
    env.GOOGLE_BUSINESS_TOKEN_ENCRYPTION_KEY,
  ];
  if (googleBusinessValues.some((value) => Boolean(value?.trim()))) {
    if (googleBusinessValues.some((value) => !value?.trim())) add("GOOGLE_BUSINESS_CONFIGURATION_INCOMPLETE");
    let encryptionKeyLength = 0;
    try {
      encryptionKeyLength = Buffer.from(env.GOOGLE_BUSINESS_TOKEN_ENCRYPTION_KEY || "", "base64").length;
    } catch {
      encryptionKeyLength = 0;
    }
    if (encryptionKeyLength !== 32) add("GOOGLE_BUSINESS_ENCRYPTION_KEY_INVALID");
    if (!isUrl(env.APP_BASE_URL, production ? ["https:"] : ["http:", "https:"])) add("GOOGLE_BUSINESS_BASE_URL_INVALID");
  } else if (production) {
    add("GOOGLE_BUSINESS_OAUTH_DISABLED", "warning");
  }

  if (env.OSM_NOMINATIM_URL && !isUrl(env.OSM_NOMINATIM_URL, ["https:"])) add("OSM_NOMINATIM_URL_INVALID");
  if (env.OSM_OVERPASS_URL && !isUrl(env.OSM_OVERPASS_URL, ["https:"])) add("OSM_OVERPASS_URL_INVALID");
  const osmTimeout = Number(env.OSM_TIMEOUT_MS || "12000");
  if (!Number.isInteger(osmTimeout) || osmTimeout < 2000 || osmTimeout > 30000) add("OSM_TIMEOUT_INVALID");
  const osmBudget = Number(env.OSM_MAX_REQUESTS_PER_MINUTE || "30");
  if (!Number.isInteger(osmBudget) || osmBudget < 1 || osmBudget > 120) add("OSM_BUDGET_INVALID");
  const osmMaxResults = Number(env.OSM_MAX_RESULTS || "30");
  if (!Number.isInteger(osmMaxResults) || osmMaxResults < 5 || osmMaxResults > 50) add("OSM_MAX_RESULTS_INVALID");

  const storageProvider = (env.OBJECT_STORAGE_PROVIDER || (production ? "disabled" : "local")).toLowerCase();
  if (!["disabled", "local", "s3"].includes(storageProvider)) add("OBJECT_STORAGE_PROVIDER_UNSUPPORTED");
  if (storageProvider === "s3" && (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY)) add("S3_CONFIGURATION_MISSING");
  if (production && storageProvider === "local") add("LOCAL_PRIVATE_STORAGE_NOT_DURABLE", "warning");
  const retentionDays = Number(env.PRIVATE_FILE_RETENTION_DAYS || "180");
  if (!Number.isInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) add("PRIVATE_FILE_RETENTION_INVALID");

  const scanProvider = (env.FILE_SCAN_PROVIDER || (production ? "disabled" : "mock")).toLowerCase();
  if (!["disabled", "mock", "clamav"].includes(scanProvider)) add("FILE_SCAN_PROVIDER_UNSUPPORTED");
  if (production && storageProvider !== "disabled" && scanProvider === "disabled") add("PRIVATE_FILE_SCANNER_REQUIRED");
  if (production && storageProvider !== "disabled" && scanProvider === "mock") add("PRIVATE_FILE_SCANNER_IS_MOCK", "warning");
  const clamavPort = Number(env.CLAMAV_PORT || "3310");
  if (scanProvider === "clamav" && (!Number.isInteger(clamavPort) || clamavPort < 1 || clamavPort > 65535)) add("CLAMAV_PORT_INVALID");

  const billingProvider = (env.BILLING_PROVIDER || "disabled").toLowerCase();
  if (!["disabled", "iyzico"].includes(billingProvider)) add("BILLING_PROVIDER_UNSUPPORTED");
  if (billingProvider === "iyzico" && (!env.IYZICO_API_KEY || !env.IYZICO_SECRET_KEY || !env.IYZICO_MERCHANT_ID)) {
    add("IYZICO_CONFIGURATION_MISSING");
  }
  if (billingProvider === "iyzico") {
    const billingUrl = env.IYZICO_API_BASE_URL || "https://sandbox-api.iyzipay.com";
    let billingHost = "";
    try {
      const parsed = new URL(billingUrl);
      billingHost = parsed.protocol === "https:" ? parsed.hostname : "";
    } catch {
      billingHost = "";
    }
    if (!["api.iyzipay.com", "sandbox-api.iyzipay.com"].includes(billingHost)) add("IYZICO_BASE_URL_INVALID");
    if (!env.IYZICO_PLAN_GROWTH_REF || !env.IYZICO_PLAN_PRO_REF) add("IYZICO_PLAN_REFERENCES_MISSING");
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

export function assertRuntimeEnvironment(env: NodeJS.ProcessEnv = process.env) {
  const result = validateRuntimeEnvironment(env);
  if (!result.ok && env.STRICT_RUNTIME_ENV === "true") {
    throw new Error(`RUNTIME_ENV_INVALID:${result.issues.filter((issue) => issue.severity === "error").map((issue) => issue.code).join(",")}`);
  }
  return result;
}
