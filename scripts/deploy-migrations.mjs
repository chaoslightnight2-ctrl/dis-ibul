import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || "";
const isVercel = process.env.VERCEL === "1";
const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);

if (!isVercel || !databaseUrl || isLocalDatabase) {
  console.log("Skipping production migration deploy.");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
