import path from "node:path";

export const PRIVATE_FILE_LIMITS = {
  maxFiles: 3,
  maxFileBytes: 8 * 1024 * 1024,
  maxTotalBytes: 16 * 1024 * 1024,
  maxRequestBytes: 18 * 1024 * 1024,
} as const;

const allowedDeclaredTypes = new Set(["", "image/jpeg", "image/png", "application/pdf"]);

export class PrivateFileValidationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export type ValidatedPrivateFile = {
  bytes: Buffer;
  contentType: "image/jpeg" | "image/png" | "application/pdf";
  originalName: string;
  sizeBytes: number;
};

function detectContentType(bytes: Buffer): ValidatedPrivateFile["contentType"] | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

function safeOriginalName(value: string) {
  const basename = path.posix.basename(path.win32.basename(value)).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return (basename || "dosya").slice(0, 180);
}

export async function validatePrivateFile(file: File): Promise<ValidatedPrivateFile> {
  if (!file.size) throw new PrivateFileValidationError("FILE_EMPTY");
  if (file.size > PRIVATE_FILE_LIMITS.maxFileBytes) throw new PrivateFileValidationError("FILE_TOO_LARGE");
  if (!allowedDeclaredTypes.has(file.type.toLowerCase())) throw new PrivateFileValidationError("FILE_TYPE_NOT_ALLOWED");

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = detectContentType(bytes);
  if (!contentType) throw new PrivateFileValidationError("FILE_SIGNATURE_NOT_ALLOWED");
  if (file.type && file.type.toLowerCase() !== contentType) throw new PrivateFileValidationError("FILE_TYPE_MISMATCH");

  return {
    bytes,
    contentType,
    originalName: safeOriginalName(file.name),
    sizeBytes: bytes.length,
  };
}

export async function validatePrivateFiles(files: File[]) {
  if (files.length > PRIVATE_FILE_LIMITS.maxFiles) throw new PrivateFileValidationError("TOO_MANY_FILES");
  const validated = await Promise.all(files.map(validatePrivateFile));
  if (validated.reduce((total, file) => total + file.sizeBytes, 0) > PRIVATE_FILE_LIMITS.maxTotalBytes) {
    throw new PrivateFileValidationError("FILES_TOTAL_TOO_LARGE");
  }
  return validated;
}
