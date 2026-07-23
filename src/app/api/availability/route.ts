import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getClinicAvailability } from "@/services/appointments/availability";

const querySchema = z.object({
  clinicSlug: z.string().trim().min(2).max(120),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dentistId: z.string().trim().min(1).max(100).optional(),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!query.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  const clinic = await prisma.clinic.findFirst({
    where: { slug: query.data.clinicSlug, isPublished: true },
    select: { id: true },
  });
  if (!clinic) return NextResponse.json({ error: "CLINIC_NOT_FOUND" }, { status: 404 });
  const availability = await getClinicAvailability({ clinicId: clinic.id, date: query.data.date, dentistId: query.data.dentistId });
  return NextResponse.json(availability, { headers: { "Cache-Control": "no-store" } });
}
