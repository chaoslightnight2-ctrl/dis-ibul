import type { Instrumentation } from "next";
import { logEvent } from "@/lib/logger";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { assertRuntimeEnvironment } = await import("@/lib/runtime-env");
  const result = assertRuntimeEnvironment();
  logEvent(result.ok ? "info" : "error", "runtime_environment_checked", {
    valid: result.ok,
    issueCodes: result.issues.map((issue) => issue.code).join(",") || null,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const digest = typeof error === "object" && error !== null && "digest" in error ? String(error.digest) : null;
  logEvent("error", "server_request_failed", {
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    digest,
    errorType: error instanceof Error ? error.name : "UnknownError",
  });
};
