#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const endpoint = process.env.DIRECTORY_IMPORT_URL?.trim();
const token = process.env.DIRECTORY_IMPORT_TOKEN?.trim();
const isProduction = endpoint ? /https:\/\/dis-ibul\.vercel\.app\//i.test(endpoint) : false;

if (!endpoint) throw new Error("DIRECTORY_IMPORT_URL gerekli");
if (!token) throw new Error("DIRECTORY_IMPORT_TOKEN gerekli");
if (isProduction && !args.has("--confirm-production")) {
  throw new Error("Production aktarımı için --confirm-production gerekli");
}

const filePath = path.resolve(process.cwd(), "data", "official-dental-centers.json");
const raw = JSON.parse(await readFile(filePath, "utf8"));
if (!Array.isArray(raw) || raw.length === 0) throw new Error("Resmi klinik dizini boş");

const allowedSource = (value) => {
  const host = new URL(value).hostname.toLowerCase();
  return host === "tdb.org.tr" || host.endsWith(".tdb.org.tr") ||
    host === "saglik.gov.tr" || host.endsWith(".saglik.gov.tr");
};

const refs = new Set();
const clinics = raw.map((clinic, index) => {
  for (const key of ["sourceRef", "name", "formattedAddress", "city", "sourceUrl"]) {
    if (!clinic[key]) throw new Error(`Kayıt ${index + 1}: ${key} eksik`);
  }
  if (!allowedSource(clinic.sourceUrl)) {
    throw new Error(`Kayıt ${index + 1}: resmi olmayan kaynak alan adı`);
  }
  if (refs.has(clinic.sourceRef)) throw new Error(`Tekrarlı sourceRef: ${clinic.sourceRef}`);
  refs.add(clinic.sourceRef);

  const query = [clinic.name, clinic.formattedAddress, clinic.city].filter(Boolean).join(" ");
  return {
    ...clinic,
    district: clinic.district ?? null,
    phone: clinic.phone ?? null,
    websiteUrl: clinic.websiteUrl ?? null,
    sourceName: "T.C. Sağlık Bakanlığı resmi sağlık tesisi dizini",
    googleSearchUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    googleVisibilityStatus: "UNKNOWN",
  };
});

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ clinics }),
});

const text = await response.text();
if (!response.ok) throw new Error(`Aktarım başarısız (${response.status}): ${text.slice(0, 500)}`);

console.log(JSON.stringify({
  ok: true,
  sourceRecords: clinics.length,
  cities: [...new Set(clinics.map((clinic) => clinic.city))].length,
  response: JSON.parse(text),
}, null, 2));