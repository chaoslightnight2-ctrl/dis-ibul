import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";

type Bucket = { count: number; resetsAt: number };
type RateLimitGlobals = { rateLimitBuckets?: Map<string, Bucket> };

const globalForRateLimit = globalThis as unknown as RateLimitGlobals;
const buckets = globalForRateLimit.rateLimitBuckets ?? new Map<string, Bucket>();

if (process.env.NODE_ENV !== "production") globalForRateLimit.rateLimitBuckets = buckets;

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: "RATE_LIMITED", message: "Çok fazla deneme yaptınız. Bir dakika sonra tekrar deneyin." },
    {
      status: 429,
      headers: {
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
        "Cache-Control": "no-store",
      },
    },
  );
}

function consumeMemoryRateLimit(key: string, limit: number, now: number) {
  const current = buckets.get(key);
  if (!current || current.resetsAt <= now) {
    buckets.set(key, { count: 1, resetsAt: now + 60_000 });
    return null;
  }

  if (current.count >= limit) return rateLimitResponse(Math.ceil((current.resetsAt - now) / 1000));
  current.count += 1;
  return null;
}

async function consumeRedisRateLimit(key: string, limit: number) {
  const client = await getRedisClient();
  if (!client) return null;

  const result = await client.eval(
    `local current = redis.call('INCR', KEYS[1])
     if current == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
     local ttl = redis.call('PTTL', KEYS[1])
     return {current, ttl}`,
    { keys: [`discibul:rate-limit:${key}`], arguments: ["60000"] },
  ) as [number, number];

  const [count, ttl] = result;
  return count > limit ? rateLimitResponse(Math.ceil(Math.max(ttl, 1) / 1000)) : null;
}

export async function guardMutation(request: Request, scope: string, limit = 12) {
  const origin = request.headers.get("origin");
  if (origin) {
    let normalizedOrigin: string;
    try {
      normalizedOrigin = new URL(origin).origin;
    } catch {
      return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
    }

    const requestUrl = new URL(request.url);
    if (process.env.NODE_ENV === "production") {
      if (!process.env.APP_BASE_URL) return NextResponse.json({ error: "SERVER_ORIGIN_NOT_CONFIGURED" }, { status: 503 });
      let configuredOrigin: string;
      try {
        configuredOrigin = new URL(process.env.APP_BASE_URL).origin;
      } catch {
        return NextResponse.json({ error: "INVALID_SERVER_ORIGIN" }, { status: 503 });
      }
      if (normalizedOrigin !== configuredOrigin) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
    } else {
      const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
      const protocol = forwardedProtocol || requestUrl.protocol.replace(":", "");
      const hosts = [
        request.headers.get("host"),
        request.headers.get("x-forwarded-host")?.split(",")[0]?.trim(),
      ].filter((host): host is string => Boolean(host));
      const acceptedOrigins = new Set([requestUrl.origin, ...hosts.map((host) => `${protocol}://${host}`)]);

      if (!acceptedOrigins.has(normalizedOrigin)) return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
    }
  }

  const now = Date.now();
  const ip = request.headers.get("cf-connecting-ip")?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "local";
  const key = `${scope}:${ip}`;
  try {
    const redisResult = await consumeRedisRateLimit(key, limit);
    if (process.env.REDIS_URL) return redisResult;
  } catch {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "RATE_LIMIT_UNAVAILABLE", message: "İşlem güvenlik kontrolü şu anda kullanılamıyor." },
        { status: 503, headers: { "Retry-After": "30", "Cache-Control": "no-store" } },
      );
    }
  }

  return consumeMemoryRateLimit(key, limit, now);
}

export async function readJson(request: Request) {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}
