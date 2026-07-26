import { expect, test } from "@playwright/test";

test("home search, popular searches, clinic order and cookie choice work", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "DişçiBul" })).toBeVisible();
  const consent = page.getByRole("dialog", { name: "Çerez tercihleri" });
  await expect(consent).toBeVisible();
  await consent.getByRole("button", { name: "Yalnızca zorunlu" }).click();
  await expect.poll(async () => page.context().cookies().then((cookies) => cookies.find((cookie) => cookie.name === "discibul_consent")?.value)).toBe("v1.necessary");

  const search = page.getByLabel("Ne arıyorsunuz?");
  await search.focus();
  await expect(page.getByLabel("En sık arananlar")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Klinikler" })).toBeVisible();
  expect(await page.getByRole("link", { name: "Detay" }).count()).toBeGreaterThan(0);

  const searchBottom = await page.locator("form[action='/arama']").boundingBox();
  const clinicsTop = await page.getByRole("heading", { level: 2, name: "Klinikler" }).boundingBox();
  expect(searchBottom && clinicsTop && clinicsTop.y >= searchBottom.y + searchBottom.height).toBeTruthy();
});

test("clinic detail exposes structured data and live appointment affordance", async ({ page, context }) => {
  await context.addCookies([{ name: "discibul_consent", value: "v1.necessary", domain: "127.0.0.1", path: "/" }]);
  await page.goto("/");
  const detail = page.getByRole("link", { name: "Detay" }).first();
  await expect(detail).toBeVisible();
  await detail.click();
  await expect(page).toHaveURL(/\/klinikler\/[^/]+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Randevu iste" })).toBeVisible();
  const structuredData = await page.locator('script[type="application/ld+json"]').textContent();
  expect(structuredData).toContain('"@type":"Dentist"');
});

test("SEO discovery endpoints are public", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain("/klinikler/");
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toContain("Disallow: /panel/");
  expect(robotsText).toContain("Sitemap:");
});

test("mobile home has no page overflow or unnamed controls", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "DişçiBul" })).toBeVisible();
  const audit = await page.evaluate(() => {
    const controls = [...document.querySelectorAll<HTMLElement>("button, input, select, textarea")].filter((element) => {
      if (element instanceof HTMLInputElement && element.type === "hidden") return false;
      const id = element.id;
      const labelled = Boolean(element.getAttribute("aria-label") || element.getAttribute("aria-labelledby") || element.getAttribute("title") || element.textContent?.trim() || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) || element.closest("label"));
      return !labelled;
    });
    return { overflow: document.documentElement.scrollWidth - window.innerWidth, unnamedControls: controls.length };
  });
  expect(audit.overflow).toBeLessThanOrEqual(1);
  expect(audit.unnamedControls).toBe(0);
  expect(consoleErrors).toEqual([]);
});

test("city search preserves filters and exposes safe contact actions", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await page.goto("/arama?source=internet&city=Ankara");
  await expect(page.getByRole("heading", { level: 1, name: "Ankara diş klinikleri" })).toBeVisible();

  const citySelects = page.getByRole("combobox", { name: /Nerede\?|Şehir/ });
  await expect(citySelects).toHaveCount(2);
  await expect(page.getByRole("combobox", { name: "Nerede?" })).toHaveValue("Ankara");
  await expect(page.getByRole("combobox", { name: "Şehir" })).toHaveValue("Ankara");
  await expect(page.getByRole("combobox", { name: "Şehir" }).locator("option")).toHaveCount(82);
  await expect(page.getByText("Google Places anahtarı yapılandırılmadığı için", { exact: false })).toHaveCount(0);
  expect(await page.locator("a[href^='tel:+90']").count()).toBeGreaterThan(0);
  expect(await page.locator("a[href^='sms:+90']").count()).toBeGreaterThan(0);

  const audit = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    tinyActions: [...document.querySelectorAll<HTMLElement>("a[href^='tel:'], a[href^='sms:']")]
      .filter((element) => element.getBoundingClientRect().height < 40).length,
  }));
  expect(audit.overflow).toBeLessThanOrEqual(1);
  expect(audit.tinyActions).toBe(0);
  expect(consoleErrors).toEqual([]);
});

test("registered clinic cards distinguish offered and unavailable treatments", async ({ page }) => {
  await page.goto("/arama?source=discibul&city=İstanbul");
  await expect(page.getByText("Yapılan tedaviler · Klinik beyanı", { exact: true })).toBeVisible();
  await expect(page.getByText("Yapılmayan tedaviler · Klinik beyanı", { exact: true })).toBeVisible();
  await expect(page.getByText("Çocuk diş hekimliği", { exact: true })).toBeVisible();
});
