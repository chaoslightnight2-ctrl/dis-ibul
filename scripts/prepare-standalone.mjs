import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

await mkdir(path.join(standalone, ".next"), { recursive: true });
await cp(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true, force: true });
if (existsSync(path.join(root, "public"))) {
  await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive: true, force: true });
}

console.log("Standalone static assets prepared.");
