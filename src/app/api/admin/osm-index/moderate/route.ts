import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { ensureOsmClinicIndexTable } from "@/services/osm/clinic-index-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  osmRefs: z.array(z.string().regex(/^(node|way|relation)\/\d+$/)).min(1).max(1000),
  action: z.enum(["DEACTIVATE", "REACTIVATE"]),
  reason: z.enum(["invalid_osm_name", "not_dental", "duplicate", "manually_reviewed_closed"]),
});

function isAuthorized(request: Request) {
  const expected = process.env.OSM_INDEX_TOKEN?.trim();
  const [scheme, token] = (request.headers.get("authorization") ?? "").split(" ");
  return Boolean(expected) && scheme?.toLowerCase() === "bearer" && token?.trim() === expected;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-osm-moderation", 10);
  if (blocked) return blocked;
  if (!isAuthorized(request)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  const payload = payloadSchema.safeParse(await readJson(request).catch(() => null));
  if (!payload.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });

  await ensureOsmClinicIndexTable();
  const deactivating = payload.data.action === "DEACTIVATE";
  const result = await prisma.osmClinicIndex.updateMany({
    where: deactivating
      ? { osmRef: { in: payload.data.osmRefs }, isActive: true }
      : { osmRef: { in: payload.data.osmRefs }, isActive: false, inactiveReason: payload.data.reason },
    data: deactivating
      ? { isActive: false, inactiveReason: payload.data.reason, inactiveAt: new Date() }
      : { isActive: true, inactiveReason: null, inactiveAt: null },
  });
  return NextResponse.json({ ok: true, action: payload.data.action, affected: result.count });
}
