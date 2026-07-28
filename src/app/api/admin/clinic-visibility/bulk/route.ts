import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { ensurePublicClinicDirectoryTable } from "@/services/directory/clinic-directory";
import { ensureOsmClinicIndexTable } from "@/services/osm/clinic-index-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const entrySchema = z.object({
  source: z.enum(["osm", "directory"]),
  ref: z.string().trim().min(1).max(300),
  status: z.enum(["FOUND", "NOT_FOUND", "SKIPPED", "ERROR"]),
  googlePlaceId: z.string().trim().min(1).max(300).nullable().optional(),
  checkedAt: z.string().datetime({ offset: true }).optional(),
}).superRefine((value, context) => {
  if (value.source === "osm" && !/^(node|way|relation)\/\d+$/.test(value.ref)) {
    context.addIssue({ code: "custom", path: ["ref"], message: "Invalid OSM reference" });
  }
  if (value.status === "FOUND" && !value.googlePlaceId) {
    context.addIssue({ code: "custom", path: ["googlePlaceId"], message: "Place ID is required for FOUND" });
  }
});
const bulkSchema = z.object({ results: z.array(entrySchema).min(1).max(500) });

function isAuthorized(request: Request) {
  const expected = (process.env.DIRECTORY_IMPORT_TOKEN || process.env.OSM_INDEX_TOKEN)?.trim();
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(" ");
  return Boolean(expected) && scheme?.toLowerCase() === "bearer" && token?.trim() === expected;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  await Promise.all([ensureOsmClinicIndexTable(), ensurePublicClinicDirectoryTable()]);
  const [osm, directory] = await Promise.all([
    prisma.osmClinicIndex.groupBy({ by: ["googleVisibilityStatus"], _count: { _all: true } }),
    prisma.publicClinicDirectory.groupBy({ by: ["googleVisibilityStatus"], _count: { _all: true } }),
  ]);
  return NextResponse.json({ ok: true, osm, directory });
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-clinic-visibility-bulk", 10);
  if (blocked) return blocked;
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const payload = bulkSchema.safeParse(await readJson(request).catch(() => null));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  await Promise.all([ensureOsmClinicIndexTable(), ensurePublicClinicDirectoryTable()]);
  let updated = 0;
  let deactivated = 0;
  let reactivated = 0;
  await prisma.$transaction(async (tx) => {
    for (const result of payload.data.results) {
      const checkedAt = result.checkedAt ? new Date(result.checkedAt) : new Date();
      const inactive = result.status === "NOT_FOUND";
      const data = {
        googleVisibilityStatus: result.status,
        googleVisibilityCheckedAt: checkedAt,
        googlePlaceId: result.status === "FOUND" ? result.googlePlaceId : undefined,
        ...(inactive ? { isActive: false, inactiveReason: "google_maps_not_found", inactiveAt: checkedAt } : {}),
      };
      const model = result.source === "osm" ? tx.osmClinicIndex : tx.publicClinicDirectory;
      const where = result.source === "osm" ? { osmRef: result.ref } : { sourceRef: result.ref };
      const write = await (model as typeof tx.osmClinicIndex).updateMany({ where, data });
      updated += write.count;
      if (inactive) deactivated += write.count;
      if (result.status === "FOUND") {
        const restoreWhere = { ...where, inactiveReason: "google_maps_not_found" };
        const restored = await (model as typeof tx.osmClinicIndex).updateMany({
          where: restoreWhere,
          data: { isActive: true, inactiveReason: null, inactiveAt: null },
        });
        reactivated += restored.count;
      }
    }
  });
  return NextResponse.json({ ok: true, submitted: payload.data.results.length, updated, deactivated, reactivated });
}
