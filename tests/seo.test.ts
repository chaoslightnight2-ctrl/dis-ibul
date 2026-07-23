import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    clinic: {
      findMany: vi.fn()
        .mockResolvedValueOnce([{ slug: "test-klinik", updatedAt: new Date("2026-07-14T00:00:00Z") }])
        .mockResolvedValueOnce([{ city: "Istanbul" }]),
    },
    dentist: { findMany: vi.fn().mockResolvedValue([{ slug: "test-doktor", updatedAt: new Date("2026-07-14T00:00:00Z") }]) },
    treatment: { findMany: vi.fn().mockResolvedValue([{ slug: "implant" }]) },
  },
}));

import sitemap, { dynamic } from "../src/app/sitemap";

afterEach(() => vi.unstubAllEnvs());

describe("SEO discovery", () => {
  it("keeps the database-backed sitemap dynamic and emits public entity routes", async () => {
    vi.stubEnv("APP_BASE_URL", "https://discibul.example/");

    expect(dynamic).toBe("force-dynamic");
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toEqual(expect.arrayContaining([
      "https://discibul.example/klinikler/test-klinik",
      "https://discibul.example/doktorlar/test-doktor",
      "https://discibul.example/tedaviler/implant",
      "https://discibul.example/dis-klinikleri/istanbul",
    ]));
  });
});
