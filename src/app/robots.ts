import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/panel/", "/auth/sifre-yenile", "/klinik-daveti/"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
