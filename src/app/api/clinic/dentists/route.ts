import { NextResponse } from "next/server";
import { clinicDentistSchema } from "@/domain/validation";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { toSlug } from "@/lib/slug";

async function availableDentistSlug(fullName: string) {
  const base = toSlug(fullName) || "dis-hekimi";
  let candidate = base;
  let suffix = 2;
  while (await prisma.dentist.findUnique({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base.slice(0, 58)}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "clinic-dentist-create", 12);
  if (blocked) return blocked;
  const access = await getClinicAccess(request, ["CLINIC_MANAGER"]);
  if (!access) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const payload = clinicDentistSchema.safeParse(await readJson(request));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const slug = await availableDentistSlug(payload.data.fullName);
  const dentist = await prisma.$transaction(async (tx) => {
    const created = await tx.dentist.create({
      data: { clinicId: access.clinic.id, slug, verificationStatus: "PENDING_SUBMISSION", ...payload.data },
    });
    await tx.auditLog.create({ data: { actorId: access.user.id, action: "CLINIC_DENTIST_CREATED", target: `dentist:${created.id}` } });
    return created;
  });
  return NextResponse.json({ id: dentist.id, slug: dentist.slug }, { status: 201 });
}
