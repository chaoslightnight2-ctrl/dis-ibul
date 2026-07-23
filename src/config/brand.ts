export const brand = {
  name: process.env.APP_BRAND_NAME || "DişçiBul",
  tagline: "Diş hekimi, klinik, fiyat ve Google puanı karşılaştırma platformu",
  supportEmail: process.env.LEGAL_CONTACT_EMAIL || "destek@discibul.com",
} as const;
