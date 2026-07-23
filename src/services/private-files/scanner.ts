import net from "node:net";

export class PrivateFileScanError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export type PrivateFileScanResult = {
  status: "CLEAN" | "INFECTED";
  detail: string | null;
};

function scannerProvider() {
  return (process.env.FILE_SCAN_PROVIDER || (process.env.NODE_ENV === "production" ? "disabled" : "mock")).toLowerCase();
}

async function scanWithClamAv(bytes: Buffer): Promise<PrivateFileScanResult> {
  const host = process.env.CLAMAV_HOST || "clamav";
  const port = Number(process.env.CLAMAV_PORT || 3310);
  const timeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS || 10_000);

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const response: Buffer[] = [];
    let settled = false;
    const finish = (error?: Error, result?: PrivateFileScanResult) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve(result!);
    };

    socket.setTimeout(timeoutMs, () => finish(new PrivateFileScanError("FILE_SCAN_TIMEOUT")));
    socket.on("error", () => finish(new PrivateFileScanError("FILE_SCAN_UNAVAILABLE")));
    socket.on("data", (chunk) => {
      response.push(chunk);
      if (response.reduce((size, part) => size + part.length, 0) > 2048) {
        finish(new PrivateFileScanError("FILE_SCAN_INVALID_RESPONSE"));
      }
    });
    socket.on("end", () => {
      const message = Buffer.concat(response).toString("utf8").trim();
      if (message.endsWith("OK")) finish(undefined, { status: "CLEAN", detail: null });
      else if (message.includes("FOUND")) finish(undefined, { status: "INFECTED", detail: "MALWARE_DETECTED" });
      else finish(new PrivateFileScanError("FILE_SCAN_INVALID_RESPONSE"));
    });
    socket.on("connect", () => {
      socket.write(Buffer.from("zINSTREAM\0"));
      for (let offset = 0; offset < bytes.length; offset += 64 * 1024) {
        const chunk = bytes.subarray(offset, Math.min(offset + 64 * 1024, bytes.length));
        const length = Buffer.allocUnsafe(4);
        length.writeUInt32BE(chunk.length);
        socket.write(length);
        socket.write(chunk);
      }
      socket.end(Buffer.alloc(4));
    });
  });
}

export async function scanPrivateFile(bytes: Buffer): Promise<PrivateFileScanResult> {
  const provider = scannerProvider();
  if (provider === "mock") return { status: "CLEAN", detail: "DEVELOPMENT_MOCK_SCAN" };
  if (provider === "clamav") return scanWithClamAv(bytes);
  throw new PrivateFileScanError("FILE_SCAN_NOT_CONFIGURED");
}
