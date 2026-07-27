import { NextResponse } from "next/server";
import { z } from "zod";
import { guardMutation, readJson } from "@/lib/request-security";
import { runOsmClinicIndexJob } from "@/services/osm/clinic-index-job";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const indexRequestSchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  targetTotal: z.number().int().min(1).max(10_000).default(1000),
  maxCities: z.number().int().min(1).max(81).default(12),
});

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" ? token?.trim() : "";
}

function isAuthorized(request: Request) {
  const expected = process.env.OSM_INDEX_TOKEN?.trim();
  return Boolean(expected) && bearerToken(request) === expected;
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "admin-osm-index", 6);
  if (blocked) return blocked;

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await readJson(request).catch(() => ({}));
  const payload = indexRequestSchema.safeParse(body);
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", fields: payload.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await runOsmClinicIndexJob({
    city: payload.data.city,
    targetTotal: payload.data.targetTotal,
    maxCities: payload.data.maxCities,
    source: "openstreetmap-admin-index",
  });

  return NextResponse.json({ ok: true, ...result });
}
