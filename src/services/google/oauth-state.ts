import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { getRedisClient } from "@/lib/redis";

const stateSchema = z.object({
  clinicId: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.number().int().positive(),
});

type StatePayload = z.infer<typeof stateSchema>;
type StateGlobals = { googleBusinessOauthStates?: Map<string, StatePayload> };
const globals = globalThis as unknown as StateGlobals;
const memoryStates = globals.googleBusinessOauthStates ?? new Map<string, StatePayload>();
if (process.env.NODE_ENV !== "production") globals.googleBusinessOauthStates = memoryStates;

function stateKey(state: string) {
  return `discibul:google-business-oauth-state:${createHash("sha256").update(state).digest("hex")}`;
}

export async function issueGoogleBusinessOauthState(clinicId: string, userId: string) {
  const state = randomBytes(32).toString("base64url");
  const payload: StatePayload = { clinicId, userId, expiresAt: Date.now() + 10 * 60_000 };
  const redis = await getRedisClient();
  if (redis) {
    const stored = await redis.set(stateKey(state), JSON.stringify(payload), { EX: 600, NX: true });
    if (stored !== "OK") throw new Error("OAUTH_STATE_NOT_STORED");
  } else {
    if (process.env.NODE_ENV === "production") throw new Error("OAUTH_STATE_STORAGE_UNAVAILABLE");
    memoryStates.set(stateKey(state), payload);
  }
  return state;
}

export async function consumeGoogleBusinessOauthState(state: string) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(state)) return null;
  const key = stateKey(state);
  const redis = await getRedisClient();
  let raw: unknown;
  if (redis) {
    raw = await redis.getDel(key);
  } else {
    if (process.env.NODE_ENV === "production") return null;
    raw = memoryStates.get(key) ?? null;
    memoryStates.delete(key);
  }

  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  const parsed = stateSchema.safeParse(value);
  return parsed.success && parsed.data.expiresAt > Date.now() ? parsed.data : null;
}
