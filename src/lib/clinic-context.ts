import { cookies } from "next/headers";
import { ACTIVE_CLINIC_COOKIE } from "@/domain/clinic-context";
import { prisma } from "@/lib/prisma";

export { ACTIVE_CLINIC_COOKIE } from "@/domain/clinic-context";

export async function getActiveClinicMembership(userId: string) {
  const activeClinicId = (await cookies()).get(ACTIVE_CLINIC_COOKIE)?.value;
  const memberships = await prisma.clinicTeamMember.findMany({
    where: { userId },
    include: { clinic: true },
    orderBy: { createdAt: "asc" },
  });
  return memberships.find((membership) => membership.clinicId === activeClinicId) ?? memberships[0] ?? null;
}
