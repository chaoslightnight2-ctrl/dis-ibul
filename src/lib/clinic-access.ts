import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";
import type { UserRole } from "@prisma/client";
import { clinicIdFromCookieHeader } from "@/domain/clinic-context";

export async function getClinicAccess(request: Request, allowedRoles: UserRole[] = ["CLINIC_MANAGER", "DENTIST"]) {
  const user = await getRequestUser(request);
  if (!user) return null;
  const activeClinicId = clinicIdFromCookieHeader(request.headers.get("cookie"));

  const membership = await prisma.clinicTeamMember.findFirst({
    where: {
      userId: user.id,
      ...(activeClinicId ? { clinicId: activeClinicId } : {}),
      role: { in: allowedRoles },
    },
    include: { clinic: true },
    orderBy: { createdAt: "asc" },
  });

  return membership ? { user, membership, clinic: membership.clinic } : null;
}
