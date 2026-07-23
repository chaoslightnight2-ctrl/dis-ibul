import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsent } from "@/components/privacy/cookie-consent";
import { brand } from "@/config/brand";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  const metadataBase = new URL(host ? `${protocol}://${host}` : process.env.APP_BASE_URL ?? "http://localhost:3000");
  const title = `${brand.name} | Diş hekimi ve klinik karşılaştırma`;

  return {
    metadataBase,
    title,
    description: brand.tagline,
    openGraph: {
      title,
      description: brand.tagline,
      type: "website",
      locale: "tr_TR",
      siteName: brand.name,
      images: [{ url: "/og.png", width: 1728, height: 904, alt: "DişçiBul klinik arama platformu" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: brand.tagline,
      images: ["/og.png"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className="h-full antialiased"
    >
      <body className="min-h-full bg-slate-50 text-slate-950">
        <SiteHeader />
        {children}
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
