import { createHash } from "node:crypto";
import { deletePrivateObject, createPrivateObjectKey, putPrivateObject } from "@/services/private-files/storage";
import { scanPrivateFile } from "@/services/private-files/scanner";
import { validatePrivateFiles } from "@/services/private-files/validation";

export type StoredPrivateUpload = {
  objectKey: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  sha256: string;
  scanStatus: "CLEAN";
  scanDetail: string | null;
};

export async function storeQuoteAttachments(files: File[]) {
  const validated = await validatePrivateFiles(files);
  const stored: StoredPrivateUpload[] = [];
  try {
    for (const file of validated) {
      const scan = await scanPrivateFile(file.bytes);
      if (scan.status !== "CLEAN") throw new Error("FILE_REJECTED_BY_SCANNER");
      const objectKey = createPrivateObjectKey("quotes");
      await putPrivateObject(objectKey, file.bytes, file.contentType);
      stored.push({
        objectKey,
        originalName: file.originalName,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
        sha256: createHash("sha256").update(file.bytes).digest("hex"),
        scanStatus: "CLEAN",
        scanDetail: scan.detail,
      });
    }
    return stored;
  } catch (error) {
    await Promise.allSettled(stored.map((file) => deletePrivateObject(file.objectKey)));
    throw error;
  }
}

export async function removeStoredPrivateUploads(files: StoredPrivateUpload[]) {
  await Promise.allSettled(files.map((file) => deletePrivateObject(file.objectKey)));
}

export function privateFileExpiry() {
  const requestedDays = Number(process.env.PRIVATE_FILE_RETENTION_DAYS || 180);
  const days = Number.isFinite(requestedDays) ? Math.min(3650, Math.max(1, Math.floor(requestedDays))) : 180;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
