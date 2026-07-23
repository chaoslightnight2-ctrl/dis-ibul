import { NextResponse } from "next/server";
import { clinicBranchSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-branch-create", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicBranchSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  const branch = await prisma.$transaction(async (tx) => {
    const branchCount = await tx.clinicBranch.count({ where: { clinicId: access.clinic.id, isActive: true } });
    const makeMain = payload.data.isMain || branchCount === 0;
    if (makeMain) await tx.clinicBranch.updateMany({ where: { clinicId: access.clinic.id }, data: { isMain: false } });
    const created = await tx.clinicBranch.create({
      data: { clinicId: access.clinic.id, ...payload.data, isMain: makeMain },
    });
    await tx.auditLog.create({
      data: { actorId: access.user.id, action: "CLINIC_BRANCH_CREATED", target: `branch:${created.id}` },
    });
    return created;
  });
  return NextResponse.json({ id: branch.id }, { status: 201 });
}
