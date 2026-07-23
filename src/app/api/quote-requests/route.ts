import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/domain/validation";
import { ensureConversation, notifyClinicTeam } from "@/lib/messaging";
import { prisma } from "@/lib/prisma";
import { guardMutation, readJson } from "@/lib/request-security";
import { getRequestUser } from "@/lib/session";
import { PrivateFileScanError } from "@/services/private-files/scanner";
import { privateFileExpiry, removeStoredPrivateUploads, storeQuoteAttachments } from "@/services/private-files/service";
import { PrivateStorageError } from "@/services/private-files/storage";
import { PRIVATE_FILE_LIMITS, PrivateFileValidationError } from "@/services/private-files/validation";

async function requestPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return { body: await readJson(request), files: [] as File[] };
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > PRIVATE_FILE_LIMITS.maxRequestBytes) {
    throw new PrivateFileValidationError("REQUEST_TOO_LARGE");
  }
  const form = await request.formData();
  const rawPayload = form.get("payload");
  if (typeof rawPayload !== "string") throw new PrivateFileValidationError("PAYLOAD_MISSING");
  let body: unknown;
  try {
    body = JSON.parse(rawPayload);
  } catch {
    throw new PrivateFileValidationError("PAYLOAD_INVALID");
  }
  const files = form.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  return { body, files };
}

export async function POST(request: Request) {
  const blocked = await guardMutation(request, "quote", 6);
  if (blocked) return blocked;

  const user = await getRequestUser(request);
  if (!user || user.role !== "PATIENT") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let parsedRequest: Awaited<ReturnType<typeof requestPayload>>;
  try {
    parsedRequest = await requestPayload(request);
  } catch (error) {
    if (error instanceof PrivateFileValidationError) {
      return NextResponse.json({ error: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
  }

  const payload = quoteRequestSchema.safeParse(parsedRequest.body);
  if (!payload.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 });
  }

  if (payload.data.budgetMin && payload.data.budgetMax && payload.data.budgetMin > payload.data.budgetMax) {
    return NextResponse.json({ error: "INVALID_BUDGET_RANGE" }, { status: 400 });
  }

  const selectedClinics = await prisma.clinic.findMany({
    where: { slug: { in: payload.data.clinicSlugs }, isPublished: true },
    select: { id: true, name: true },
  });
  if (selectedClinics.length !== payload.data.clinicSlugs.length) {
    return NextResponse.json({ error: "CLINIC_NOT_FOUND" }, { status: 404 });
  }

  let storedFiles: Awaited<ReturnType<typeof storeQuoteAttachments>> = [];
  try {
    storedFiles = await storeQuoteAttachments(parsedRequest.files);
  } catch (error) {
    if (error instanceof PrivateFileValidationError) return NextResponse.json({ error: error.code }, { status: 400 });
    if (error instanceof PrivateFileScanError || error instanceof PrivateStorageError) {
      return NextResponse.json({ error: error.code }, { status: 503 });
    }
    if (error instanceof Error && error.message === "FILE_REJECTED_BY_SCANNER") {
      return NextResponse.json({ error: "FILE_REJECTED_BY_SCANNER" }, { status: 400 });
    }
    return NextResponse.json({ error: "FILE_PROCESSING_FAILED" }, { status: 503 });
  }

  const ipAddress = request.headers.get("cf-connecting-ip")?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  let quote: { id: string; attachments: Array<{ id: string }> };
  try {
    quote = await prisma.$transaction(async (tx) => {
      const created = await tx.quoteRequest.create({
        data: {
          userId: user.id,
          treatmentName: payload.data.treatmentName,
          complaint: payload.data.complaint,
          city: payload.data.city,
          requesterName: payload.data.fullName,
          requesterEmail: payload.data.email,
          requesterPhone: payload.data.phone,
          budgetMin: payload.data.budgetMin,
          budgetMax: payload.data.budgetMax,
          hasPriorExam: payload.data.hasPriorExam,
          hasImaging: payload.data.hasImaging,
          preferredDate: payload.data.preferredDate ? new Date(payload.data.preferredDate) : null,
          contactPreference: payload.data.contactPreference,
          kvkkConsent: true,
          healthDataConsent: true,
          selectedClinics: { create: selectedClinics.map((clinic) => ({ clinicId: clinic.id })) },
          attachments: storedFiles.length ? {
            create: storedFiles.map((file) => ({
              ownerId: user.id,
              purpose: "QUOTE_ATTACHMENT",
              objectKey: file.objectKey,
              originalName: file.originalName,
              contentType: file.contentType,
              sizeBytes: file.sizeBytes,
              sha256: file.sha256,
              scanStatus: file.scanStatus,
              scanDetail: file.scanDetail,
              expiresAt: privateFileExpiry(),
            })),
          } : undefined,
        },
        include: { attachments: { select: { id: true } } },
      });
      await tx.consentRecord.create({
        data: {
          userId: user.id,
          consentType: "HEALTH_DATA_QUOTE",
          consentVersion: "2026-07-15",
          granted: true,
          ipAddress,
        },
      });
      for (const attachment of created.attachments) {
        await tx.auditLog.create({
          data: {
            actorId: user.id,
            action: "PRIVATE_FILE_UPLOADED",
            target: `private-file:${attachment.id}`,
            metadata: { quoteRequestId: created.id },
            ipAddress,
          },
        });
      }
      for (const clinic of selectedClinics) {
        const conversation = await ensureConversation(tx, clinic.id, user.id);
        await notifyClinicTeam(tx, clinic.id, {
          type: "QUOTE_CREATED",
          title: "Yeni fiyat teklifi talebi",
          body: `${payload.data.fullName}, ${payload.data.treatmentName} için fiyat bilgisi istiyor.`,
          conversationId: conversation.id,
        });
      }
      return created;
    });
  } catch (error) {
    await removeStoredPrivateUploads(storedFiles);
    throw error;
  }

  return NextResponse.json({
    id: quote.id,
    status: "PENDING",
    attachmentCount: quote.attachments.length,
    privacy: "Her klinik yalnızca kendisine iletilen talebi görebilir.",
  }, { status: 201 });
}
