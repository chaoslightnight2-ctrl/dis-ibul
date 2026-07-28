import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { upsertOsmClinicIndex } from "@/services/osm/clinic-index";
import { ensureOsmClinicIndexTable } from "@/services/osm/clinic-index-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clinicSchema = z.object({
  osmType: z.enum(["node", "way", "relation"]),
  osmId: z.number().int().nonnegative(),
  name: z.string().trim().min(1).max(300),
  formattedAddress: z.string().trim().min(1).max(1000),
  city: z.string().trim().max(120).nullable(),
  district: z.string().trim().max(120).nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().trim().max(200).nullable(),
  websiteUrl: z.string().trim().max(1000).nullable(),
  openingHours: z.string().trim().max(1000).nullable(),
  wheelchairAccess: z.boolean().nullable(),
  specialties: z.array(z.string().trim().min(1).max(120)).max(30),
  osmUrl: z.string().url().max(1000),
  googleSearchUrl: z.string().url().max(2000),
  googlePlaceId: z.string().trim().max(300).nullable().optional(),
  googleVisibilityStatus: z.enum(["UNKNOWN", "FOUND", "NOT_FOUND", "SKIPPED", "ERROR"]).optional(),
  googleVisibilityCheckedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const bulkSchema = z.object({ clinics: z.array(clinicSchema).min(1).max(100) });
const cleanupSchema = z.object({
  osmRefs: z.array(z.string().regex(/^(node|way|relation)\/\d+$/)).min(1).max(3000),
});

function isAuthorized(request: Request) {
  const expected = process.env.OSM_INDEX_TOKEN?.trim();
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return Boolean(expected) && scheme?.toLowerCase() === "bearer" && token?.trim() === expected;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-osm-index-bulk", 30);
  if (blocked) return blocked;
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const payload = bulkSchema.safeParse(await readJson(request).catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  await ensureOsmClinicIndexTable();
  const result = await upsertOsmClinicIndex(payload.data.clinics, "openstreetmap-bulk-import");
  const totalIndexedClinics = await prisma.osmClinicIndex.count();
  return NextResponse.json({ ok: true, imported: result.count, totalIndexedClinics });
}

export async function DELETE(request: Request) {
  const blocked = await guardMutation(request, "admin-osm-index-bulk-cleanup", 5);
  if (blocked) return blocked;
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const payload = cleanupSchema.safeParse(await readJson(request).catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  await ensureOsmClinicIndexTable();
  const result = await prisma.osmClinicIndex.updateMany({
    where: {
      source: "openstreetmap-bulk-import",
      osmRef: { notIn: payload.data.osmRefs },
      isActive: true,
    },
    data: {
      isActive: false,
      inactiveReason: "missing_from_latest_bulk_import",
      inactiveAt: new Date(),
    },
  });
  const totalIndexedClinics = await prisma.osmClinicIndex.count({ where: { isActive: true } });
  return NextResponse.json({ ok: true, deactivated: result.count, totalIndexedClinics });
}
