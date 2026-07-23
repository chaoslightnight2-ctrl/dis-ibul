import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { guardMutation } from "@/lib/request-security";

const handler = toNextJsHandler(auth);

const sensitiveLimits: Record<string, number> = {
  "/api/auth/sign-in/email": 8,
  "/api/auth/sign-up/email": 4,
  "/api/auth/request-password-reset": 3,
  "/api/auth/send-verification-email": 3,
  "/api/auth/reset-password": 5,
};

export const GET = handler.GET;

export async function POST(request: Request) {
  const path = new URL(request.url).pathname;
  const blocked = await guardMutation(request, `auth:${path}`, sensitiveLimits[path] ?? 30);
  if (blocked) return blocked;
  return handler.POST(request);
}
