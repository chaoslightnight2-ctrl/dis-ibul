import { brand } from "@/config/brand";
import { prisma } from "@/lib/prisma";
import { pingRedis } from "@/lib/redis";
import { validateRuntimeEnvironment } from "@/lib/runtime-env";

type DependencyStatus = "available" | "unavailable" | "not_configured";

async function withTimeout<T>(operation: Promise<T>, timeoutMs = 2_000) {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("HEALTH_CHECK_TIMEOUT")), timeoutMs)),
  ]);
}

export async function getRuntimeHealth() {
  const [database, redis] = await Promise.all([
    withTimeout(prisma.$queryRaw`SELECT 1`).then((): DependencyStatus => "available").catch((): DependencyStatus => "unavailable"),
    process.env.REDIS_URL
      ? withTimeout(pingRedis()).then((ok): DependencyStatus => ok ? "available" : "unavailable").catch((): DependencyStatus => "unavailable")
      : Promise.resolve<DependencyStatus>("not_configured"),
  ]);
  const configuration = validateRuntimeEnvironment();
  const dependenciesReady = database === "available" && (redis === "available" || process.env.NODE_ENV !== "production");
  const ok = dependenciesReady && configuration.ok;

  return {
    ok,
    service: brand.name,
    version: process.env.DEPLOYMENT_VERSION || "local",
    dependencies: { database, redis },
    configuration: {
      ok: configuration.ok,
      issues: configuration.issues.map((issue) => issue.code),
    },
    time: new Date().toISOString(),
  };
}
