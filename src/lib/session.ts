import type { UserRole } from "@prisma/client";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true, emailVerifiedAt: true, role: true },
  });
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/giris");

  if (roles && !roles.includes(user.role)) {
    redirect(user.role === "PATIENT" ? "/panel/hasta" : "/panel/klinik");
  }

  return user;
}

export async function getRequestUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true, emailVerifiedAt: true, role: true },
  });
}
