import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { toSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const [clinics, dentists, treatments, cities] = await Promise.all([
    prisma.clinic.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.dentist.findMany({ where: { isActive: true, verificationStatus: "VERIFIED", clinic: { isPublished: true } }, select: { slug: true, updatedAt: true } }),
    prisma.treatment.findMany({ select: { slug: true } }),
    prisma.clinic.findMany({ where: { isPublished: true }, distinct: ["city"], select: { city: true } }),
  ]);
  const staticPaths = ["", "/arama", "/auth/giris", "/auth/kayit", "/hukuki/kvkk", "/hukuki/gizlilik", "/hukuki/kullanim-kosullari", "/hukuki/cerezler"];
  return [
    ...staticPaths.map((path) => ({ url: `${baseUrl}${path}`, changeFrequency: "weekly" as const, priority: path ? 0.6 : 1 })),
    ...clinics.map((clinic) => ({ url: `${baseUrl}/klinikler/${clinic.slug}`, lastModified: clinic.updatedAt, changeFrequency: "daily" as const, priority: 0.9 })),
    ...dentists.map((dentist) => ({ url: `${baseUrl}/doktorlar/${dentist.slug}`, lastModified: dentist.updatedAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...treatments.map((treatment) => ({ url: `${baseUrl}/tedaviler/${treatment.slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...cities.map(({ city }) => ({ url: `${baseUrl}/dis-klinikleri/${toSlug(city)}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
