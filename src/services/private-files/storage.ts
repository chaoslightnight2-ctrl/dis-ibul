import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class PrivateStorageError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

type DownloadTarget =
  | { kind: "bytes"; bytes: Buffer }
  | { kind: "redirect"; url: string };

let s3Client: S3Client | undefined;

function storageProvider() {
  return (process.env.OBJECT_STORAGE_PROVIDER || (process.env.NODE_ENV === "production" ? "disabled" : "local")).toLowerCase();
}

function localRoot() {
  const configuredPath = process.env.PRIVATE_STORAGE_LOCAL_PATH || path.join(".data", "private");
  if (path.isAbsolute(configuredPath)) return path.normalize(configuredPath);
  return path.join(/* turbopackIgnore: true */ process.cwd(), configuredPath);
}

function localObjectPath(objectKey: string) {
  if (!/^[a-z0-9][a-z0-9/_-]*$/i.test(objectKey)) throw new PrivateStorageError("INVALID_OBJECT_KEY");
  const root = localRoot();
  const target = path.resolve(root, ...objectKey.split("/"));
  if (!target.startsWith(`${root}${path.sep}`)) throw new PrivateStorageError("INVALID_OBJECT_KEY");
  return target;
}

function client() {
  if (!s3Client) {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    s3Client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
    });
  }
  return s3Client;
}

function bucket() {
  if (!process.env.S3_BUCKET) throw new PrivateStorageError("S3_BUCKET_NOT_CONFIGURED");
  return process.env.S3_BUCKET;
}

function contentDisposition(fileName: string) {
  const fallback = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "dosya";
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

export function createPrivateObjectKey(scope: "quotes" | "verification") {
  const date = new Date();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${scope}/${date.getUTCFullYear()}/${month}/${randomUUID().replaceAll("-", "")}`;
}

export async function putPrivateObject(objectKey: string, bytes: Buffer, contentType: string) {
  const provider = storageProvider();
  if (provider === "local") {
    const target = localObjectPath(objectKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
    return;
  }
  if (provider === "s3") {
    await client().send(new PutObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
      Body: bytes,
      ContentType: contentType,
      Metadata: { private: "true" },
    }));
    return;
  }
  throw new PrivateStorageError("PRIVATE_STORAGE_NOT_CONFIGURED");
}

export async function deletePrivateObject(objectKey: string) {
  const provider = storageProvider();
  if (provider === "local") {
    await rm(localObjectPath(objectKey), { force: true });
    return;
  }
  if (provider === "s3") {
    await client().send(new DeleteObjectCommand({ Bucket: bucket(), Key: objectKey }));
    return;
  }
}

export async function getPrivateDownload(objectKey: string, fileName: string, contentType: string): Promise<DownloadTarget> {
  const provider = storageProvider();
  if (provider === "local") return { kind: "bytes", bytes: await readFile(localObjectPath(objectKey)) };
  if (provider === "s3") {
    const command = new GetObjectCommand({
      Bucket: bucket(),
      Key: objectKey,
      ResponseContentType: contentType,
      ResponseContentDisposition: contentDisposition(fileName),
    });
    return { kind: "redirect", url: await getSignedUrl(client(), command, { expiresIn: 60 }) };
  }
  throw new PrivateStorageError("PRIVATE_STORAGE_NOT_CONFIGURED");
}

export { contentDisposition };
