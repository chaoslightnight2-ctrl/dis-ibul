import { turkeyCities } from "../src/config/turkey-cities";

async function main() {
  const baseUrl = (process.env.CLINIC_AUDIT_BASE_URL || "https://dis-ibul.vercel.app").replace(/\/$/, "");
  const queue = [...turkeyCities];
  const results: Array<{
    city: string;
    registered: number;
    osm: number;
    directory: number;
    total: number;
  }> = [];

  async function auditCity(city: string) {
    const url = new URL("/api/clinics", baseUrl);
    url.searchParams.set("source", "internet");
    url.searchParams.set("city", city);

    let response: Response | null = null;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      response = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
      if (response.status !== 429) break;
      await new Promise((resolve) => setTimeout(resolve, 5_000));
    }
    if (!response?.ok) throw new Error(city + ": HTTP " + (response?.status ?? "NO_RESPONSE"));

    const payload = await response.json() as {
      data?: {
        registeredClinics?: unknown[];
        osmClinics?: unknown[];
        directoryClinics?: unknown[];
      };
    };
    const registered = payload.data?.registeredClinics?.length ?? 0;
    const osm = payload.data?.osmClinics?.length ?? 0;
    const directory = payload.data?.directoryClinics?.length ?? 0;
    results.push({ city, registered, osm, directory, total: registered + osm + directory });
  }

  while (queue.length > 0) {
    const city = queue.shift();
    if (!city) continue;
    await auditCity(city);
    await new Promise((resolve) => setTimeout(resolve, 1_100));
  }

  results.sort((a, b) => turkeyCities.indexOf(a.city as typeof turkeyCities[number]) - turkeyCities.indexOf(b.city as typeof turkeyCities[number]));
  const zeroCities = results.filter((item) => item.total === 0);
  const summary = {
    baseUrl,
    auditedCities: results.length,
    coveredCities: results.length - zeroCities.length,
    zeroCities: zeroCities.map((item) => item.city),
    resultRowsAcrossCities: results.reduce((sum, item) => sum + item.total, 0),
    osmRowsAcrossCities: results.reduce((sum, item) => sum + item.osm, 0),
    directoryRowsAcrossCities: results.reduce((sum, item) => sum + item.directory, 0),
    cities: results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (zeroCities.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});