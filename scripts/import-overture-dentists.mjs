#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const endpoint = process.env.DIRECTORY_IMPORT_URL || "https://dis-ibul.vercel.app/api/admin/clinic-directory/bulk";
const token = process.env.DIRECTORY_IMPORT_TOKEN;
if (!token) throw new Error("DIRECTORY_IMPORT_TOKEN gerekli");
if (!process.argv.includes("--confirm-production")) throw new Error("--confirm-production gerekli");

const fileFlag = process.argv.indexOf("--file");
const importFile = fileFlag >= 0 ? process.argv[fileFlag + 1] : "C:/tmp/overture-dental-clinics.json";
if (fileFlag >= 0 && !importFile) throw new Error("--file için yol gerekli");
const clinics = JSON.parse(await readFile(importFile, "utf8"));
let imported = 0;
let totalDirectoryClinics = 0;
for (let offset = 0; offset < clinics.length; offset += 500) {
  const batch = clinics.slice(offset, offset + 500);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ clinics: batch }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Batch ${offset / 500 + 1}: ${response.status} ${body.slice(0, 400)}`);
  const result = JSON.parse(body);
  imported += result.imported;
  totalDirectoryClinics = result.totalDirectoryClinics;
  console.log(JSON.stringify({ batch: offset / 500 + 1, imported, totalDirectoryClinics }));
}
console.log(JSON.stringify({ ok: true, sourceRecords: clinics.length, imported, totalDirectoryClinics }));
