import { spawnSync } from "node:child_process";

const isVercel = process.env.VERCEL === "1";
const databaseUrl = process.env.DATABASE_URL || process.env.DATABASE_POSTGRES_PRISMA_URL || process.env.DATABASE_POSTGRES_URL || "";
const skip = process.env.SKIP_OSM_INDEX === "1";

if (!isVercel || skip) {
  console.log("Skipping production clinic index.");
  process.exit(0);
}

if (!databaseUrl || /localhost|127\.0\.0\.1/.test(databaseUrl)) {
  console.log("Skipping production clinic index: managed database URL is not available.");
  process.exit(0);
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  OSM_INDEX_TARGET_TOTAL: process.env.OSM_INDEX_TARGET_TOTAL || "300",
  OSM_INDEX_MAX_CITIES_PER_RUN: process.env.OSM_INDEX_MAX_CITIES_PER_RUN || "12",
  OSM_MAX_RESULTS: process.env.OSM_MAX_RESULTS || "500",
  OSM_MAX_RESULTS_TURKEY: process.env.OSM_MAX_RESULTS_TURKEY || "1000",
};

console.log("Ensuring production OpenStreetMap clinic index has at least 300 clinics.");

const command = process.platform === "win32" ? "npm.cmd" : "npm";
const result = spawnSync(command, ["run", "osm:index", "--", "--target-total=300", "--limit-cities=12"], {
  env,
  stdio: "inherit",
  shell: false,
});

if (result.status !== 0) {
  console.warn("Production clinic index could not be completed during build.");
}

process.exit(0);
