import { NextResponse } from "next/server";
import { getClinicAccess } from "@/lib/clinic-access";
import { prisma } from "@/lib/prisma";
import { getRequestUser } from "@/lib/session";
import { contentDisposition, getPrivateDownload, PrivateStorageError } from "@/services/private-files/storage";

type PrivateFileRouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: PrivateFileRouteProps) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const file = await prisma.privateFile.findUnique({
    where: { id },
    include: {
      quoteRequest: {
        select: { selectedClinics: { select: { clinicId: true } } },
      },
    },
  });
  if (!file || file.deletedAt || file.scanStatus !== "CLEAN") {
    return NextResponse.json({ error: "FILE_NOT_FOUND" }, { status: 404 });
  }

  let authorized = file.ownerId === user.id || ["MODERATOR", "SUPER_ADMIN"].includes(user.role);
  if (!authorized && file.quoteRequest) {
    const access = await getClinicAccess(request);
    authorized = Boolean(access && file.quoteRequest.selectedClinics.some((clinic) => clinic.clinicId === access.clinic.id));
  }
  if (!authorized) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  if (file.expiresAt <= new Date()) return NextResponse.json({ error: "FILE_EXPIRED" }, { status: 410 });

  let download: Awaited<ReturnType<typeof getPrivateDownload>>;
  try {
    download = await getPrivateDownload(file.objectKey, file.originalName, file.contentType);
  } catch (error) {
    if (error instanceof PrivateStorageError) {
      return NextResponse.json({ error: "FILE_STORAGE_UNAVAILABLE" }, { status: 503 });
    }
    return NextResponse.json({ error: "FILE_UNAVAILABLE" }, { status: 503 });
  }

  const ipAddress = request.headers.get("cf-connecting-ip")?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "PRIVATE_FILE_ACCESSED",
      target: `private-file:${file.id}`,
      metadata: { purpose: file.purpose },
      ipAddress,
    },
  });

  if (download.kind === "redirect") {
    const response = NextResponse.redirect(download.url, 302);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  return new Response(new Uint8Array(download.bytes), {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(download.bytes.length),
      "Content-Disposition": contentDisposition(file.originalName),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
