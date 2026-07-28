import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { ensurePublicClinicDirectoryTable, upsertPublicClinicDirectory } from "@/services/directory/clinic-directory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const directoryClinicSchema = z.object({
  sourceRef: z.string().trim().min(1).max(300),
  name: z.string().trim().min(1).max(300),
  formattedAddress: z.string().trim().min(1).max(1000),
  city: z.string().trim().max(120).nullable(),
  district: z.string().trim().max(120).nullable(),
  phone: z.string().trim().max(200).nullable(),
  websiteUrl: z.string().trim().max(1000).nullable(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  sourceName: z.string().trim().min(1).max(300),
  sourceUrl: z.string().url().max(1000),
  sourceUpdatedAt: z.string().datetime({ offset: true }).nullable(),
  googleSearchUrl: z.string().url().max(2000),
  googlePlaceId: z.string().trim().max(300).nullable().optional(),
  googleVisibilityStatus: z.enum(["UNKNOWN", "FOUND", "NOT_FOUND", "SKIPPED", "ERROR"]).optional(),
  googleVisibilityCheckedAt: z.string().datetime({ offset: true }).nullable().optional(),
  googleRating: z.number().min(0).max(5).nullable().optional(),
  googleReviewCount: z.number().int().nonnegative().nullable().optional(),
  googleRatingUrl: z.string().url().max(2000).nullable().optional(),
  googleRatingSyncedAt: z.string().datetime({ offset: true }).nullable().optional(),
});

const bulkSchema = z.object({ clinics: z.array(directoryClinicSchema).min(1).max(500) });

function isAuthorized(request: Request) {
  const expected = (process.env.DIRECTORY_IMPORT_TOKEN || process.env.OSM_INDEX_TOKEN)?.trim();
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return Boolean(expected) && scheme?.toLowerCase() === "bearer" && token?.trim() === expected;
}

async function countDirectoryClinics() {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS "count" FROM "PublicClinicDirectory"
  `;
  return rows[0]?.count ?? 0;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-clinic-directory-bulk", 20);
  if (blocked) return blocked;
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const payload = bulkSchema.safeParse(await readJson(request).catch(() => null));
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  await ensurePublicClinicDirectoryTable();
  const result = await upsertPublicClinicDirectory(payload.data.clinics);
  const totalDirectoryClinics = await countDirectoryClinics();
  return NextResponse.json({ ok: true, imported: result.count, totalDirectoryClinics });
}
