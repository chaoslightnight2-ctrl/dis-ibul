import { NextResponse } from "next/server";
import { clinicTeamRoleSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";

async function syncGlobalClinicRole(userId: string) {
  const memberships = await prisma.clinicTeamMember.findMany({ where: { userId }, select: { role: true } });
  const role = memberships.some((membership) => membership.role === "CLINIC_MANAGER")
    ? "CLINIC_MANAGER"
    : memberships.length
      ? "DENTIST"
      : "PATIENT";
  await prisma.user.updateMany({
    where: { id: userId, role: { notIn: ["MODERATOR", "SUPER_ADMIN"] } },
    data: { role },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-team-role", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicTeamRoleSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const { id } = await context.params;
  const member = await prisma.clinicTeamMember.findFirst({ where: { id, clinicId: access.clinic.id } });
  if (!member) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    await prisma.$transaction(async (tx) => {
      if (member.role === "CLINIC_MANAGER" && payload.data.role !== "CLINIC_MANAGER") {
        const managerCount = await tx.clinicTeamMember.count({ where: { clinicId: access.clinic.id, role: "CLINIC_MANAGER" } });
        if (managerCount <= 1) throw new Error("LAST_MANAGER_REQUIRED");
      }
      await tx.clinicTeamMember.update({ where: { id }, data: { role: payload.data.role } });
      await tx.auditLog.create({
        data: { actorId: access.user.id, action: "CLINIC_TEAM_ROLE_UPDATED", target: `membership:${id}`, metadata: { role: payload.data.role } },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_MANAGER_REQUIRED") {
      return NextResponse.json({ error: "LAST_MANAGER_REQUIRED" }, { status: 409 });
    }
    return NextResponse.json({ error: "CONCURRENT_TEAM_UPDATE" }, { status: 409 });
  }
  await syncGlobalClinicRole(member.userId);
  return NextResponse.json({ id, role: payload.data.role });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const blocked = await guardMutation(request, "clinic-team-remove", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await context.params;
  const member = await prisma.clinicTeamMember.findFirst({ where: { id, clinicId: access.clinic.id } });
  if (!member) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    await prisma.$transaction(async (tx) => {
      if (member.role === "CLINIC_MANAGER") {
        const managerCount = await tx.clinicTeamMember.count({ where: { clinicId: access.clinic.id, role: "CLINIC_MANAGER" } });
        if (managerCount <= 1) throw new Error("LAST_MANAGER_REQUIRED");
      }
      await tx.clinicTeamMember.delete({ where: { id } });
      await tx.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_TEAM_MEMBER_REMOVED", target: `membership:${id}` } });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_MANAGER_REQUIRED") {
      return NextResponse.json({ error: "LAST_MANAGER_REQUIRED" }, { status: 409 });
    }
    return NextResponse.json({ error: "CONCURRENT_TEAM_UPDATE" }, { status: 409 });
  }
  await syncGlobalClinicRole(member.userId);
  return NextResponse.json({ id, removed: true });
}
