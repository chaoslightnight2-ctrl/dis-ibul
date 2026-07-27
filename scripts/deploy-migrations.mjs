import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || "";
const isVercel = process.env.VERCEL === "1";
const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const shouldDeployMigrations = process.env.RUN_PRISMA_MIGRATIONS === "1";

// The production Neon database predates this repository's Prisma migration
// history. Running `prisma migrate deploy` against that non-empty schema fails
// with P3005 and blocks every Vercel deployment. Keep migrations opt-in until
// the existing database has been baselined explicitly.
if (!isVercel || !databaseUrl || isLocalDatabase || !shouldDeployMigrations) {
  console.log("Skipping production migration deploy.");
  process.exit(0);
}

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
