import { getRequestUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getRequestUser(request);
  if (!user) return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      emailVerifiedAt: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      profile: true,
      patientProfile: true,
      favorites: {
        select: {
          createdAt: true,
          clinic: { select: { name: true, slug: true, city: true, district: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      appointmentRequests: {
        select: {
          id: true,
          treatmentName: true,
          preferredDate: true,
          note: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          clinic: { select: { name: true, slug: true, city: true, district: true } },
          history: { select: { status: true, note: true, createdAt: true }, orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      quoteRequests: {
        select: {
          id: true,
          treatmentName: true,
          complaint: true,
          city: true,
          preferredDate: true,
          budgetMin: true,
          budgetMax: true,
          contactPreference: true,
          createdAt: true,
          attachments: {
            where: { deletedAt: null },
            select: { id: true, originalName: true, contentType: true, sizeBytes: true, scanStatus: true, createdAt: true, expiresAt: true },
          },
          selectedClinics: {
            select: {
              clinic: { select: { name: true, slug: true } },
              response: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      consentRecords: {
        select: { consentType: true, consentVersion: true, granted: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
      deletionRequests: {
        select: { id: true, status: true, requestedBy: true, createdAt: true, updatedAt: true, resolvedAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!account) return Response.json({ error: "NOT_FOUND" }, { status: 404 });

  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), account }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": "attachment; filename=discibul-hesap-verilerim.json",
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
