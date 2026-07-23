import { defineConfig, devices } from "@playwright/test";

const browserChannel = process.env.PLAYWRIGHT_CHANNEL as "chrome" | "msedge" | undefined;
const channel = browserChannel ? { channel: browserChannel } : {};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], ...channel } },
    { name: "iphone-chromium", use: { ...devices["iPhone 13"], browserName: "chromium", ...channel } },
    { name: "android-chromium", use: { ...devices["Pixel 7"], browserName: "chromium", ...channel } },
  ],
});
