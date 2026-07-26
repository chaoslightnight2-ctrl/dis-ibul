/**
 * Playwright browser manager — singleton (Firefox).
 *
 * Python google-maps-scraper'ın keşfi: **Chromium headless'ta Google review verisini gizliyor.**
 * Firefox ile çalışıyor! Bu yüzden Firefox kullanıyoruz.
 *
 * - Lazy-launches Firefox on first use
 * - Reuses browser across requests
 * - Auto-restart on crash / disconnect
 * - Graceful shutdown on SIGTERM / SIGINT
 */

import { firefox, type Browser } from "playwright";
import { logEvent } from "@/lib/logger";

/* ------------------------------------------------------------------ */
/*  Global singleton                                                  */
/* ------------------------------------------------------------------ */

const BROWSER_KEY = Symbol.for("discibul:playwright-browser");
const CLOSING_KEY = "discibul:playwright-closing";

type Globals = typeof globalThis & {
  [BROWSER_KEY]?: Browser;
  [CLOSING_KEY]?: boolean;
};

function getGlobals(): Globals {
  return globalThis as Globals;
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export async function getBrowser(): Promise<Browser> {
  const g = getGlobals();

  if (g[CLOSING_KEY]) {
    await waitForClose();
  }

  const existing = g[BROWSER_KEY];
  if (existing && existing.isConnected()) {
    return existing;
  }

  if (existing) {
    await safelyClose(existing);
    g[BROWSER_KEY] = undefined;
  }

  logEvent("info", "browser_launch_start", { engine: "firefox" });
  try {
    // 15sn timeout ile launch — asla sonsuza kadar bekleme
    g[BROWSER_KEY] = await Promise.race([
      firefox.launch({ headless: true }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("BROWSER_LAUNCH_TIMEOUT")), 15_000),
      ),
    ]);

    g[BROWSER_KEY]!.on("disconnected", () => {
      logEvent("warn", "browser_disconnected");
      g[BROWSER_KEY] = undefined;
    });

    logEvent("info", "browser_launch_ok", { engine: "firefox" });
    return g[BROWSER_KEY]!;
  } catch (error) {
    g[BROWSER_KEY] = undefined;
    logEvent("error", "browser_launch_failed", { error: String(error) });
    throw error;
  }
}

export async function closeBrowser(): Promise<void> {
  const g = getGlobals();
  if (g[CLOSING_KEY]) return;
  g[CLOSING_KEY] = true;

  const browser = g[BROWSER_KEY];
  if (browser) {
    logEvent("info", "browser_close_start");
    await safelyClose(browser);
    g[BROWSER_KEY] = undefined;
    logEvent("info", "browser_close_ok");
  }

  g[CLOSING_KEY] = false;
}

/**
 * Google Maps scraping için uygun bir browser context yarat.
 * - CONSENT cookie ile consent dialog'unu bypass
 * - tr-TR locale
 * - Her çağrıda temiz context (izolasyon)
 */
export async function createScrapeContext() {
  const browser = await getBrowser();
  const context = await browser.newContext({
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    viewport: { width: 1920, height: 1080 },
    javaScriptEnabled: true,
  });

  // Google consent dialog'unu bypass et
  await context.addCookies([
    {
      name: "CONSENT",
      value: "YES+cb.20240101-01-p0.en+FX+430",
      domain: ".google.com",
      path: "/",
    },
  ]);

  return context;
}

/* ------------------------------------------------------------------ */
/*  Process lifecycle hooks                                          */
/* ------------------------------------------------------------------ */

function onShutdown() {
  closeBrowser().catch(() => {});
}

let hooksAttached = false;
function ensureShutdownHook() {
  if (hooksAttached) return;
  hooksAttached = true;
  process.once("SIGTERM", onShutdown);
  process.once("SIGINT", onShutdown);
  process.once("beforeExit", onShutdown);
}

ensureShutdownHook();

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function safelyClose(browser: Browser) {
  try {
    const contexts = browser.contexts();
    await Promise.allSettled(contexts.map((ctx) => ctx.close()));
    await browser.close();
  } catch {
    // Zaten kapalıysa sorun değil
  }
}

function waitForClose(): Promise<void> {
  const g = getGlobals();
  return new Promise((resolve) => {
    const check = () => {
      if (!g[CLOSING_KEY]) return resolve();
      setImmediate(check);
    };
    setImmediate(check);
  });
}
