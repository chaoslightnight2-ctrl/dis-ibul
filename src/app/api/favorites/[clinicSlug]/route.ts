import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardMutation } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";

type RouteContext = { params: Promise<{ clinicSlug: string }> };

async function getPatientAndClinic(request: Request, context: RouteContext) {
  const user = await getRequestUser(request);
  if (!user || user.role !== "PATIENT") return null;
  const { clinicSlug } = await context.params;
  const clinic = await prisma.clinic.findFirst({
    where: { slug: clinicSlug, isPublished: true },
    select: { id: true },
  });
  return clinic ? { user, clinic } : null;
}

export async function POST(request: Request, context: RouteContext) {
  const blocked = await guardMutation(request, "favorite", 30);
  if (blocked) return blocked;
  const access = await getPatientAndClinic(request, context);
  if (!access) return NextResponse.json({ error: "NOT_FOUND_OR_UNAUTHORIZED" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_clinicId: { userId: access.user.id, clinicId: access.clinic.id } },
    update: {},
    create: { userId: access.user.id, clinicId: access.clinic.id },
  });
  await prisma.analyticsEvent.create({ data: { clinicId: access.clinic.id, type: "FAVORITE_ADDED" } });
  return NextResponse.json({ favorite: true }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext) {
  const blocked = await guardMutation(request, "favorite", 30);
  if (blocked) return blocked;
  const access = await getPatientAndClinic(request, context);
  if (!access) return NextResponse.json({ error: "NOT_FOUND_OR_UNAUTHORIZED" }, { status: 404 });

  await prisma.favorite.deleteMany({ where: { userId: access.user.id, clinicId: access.clinic.id } });
  return NextResponse.json({ favorite: false });
}
