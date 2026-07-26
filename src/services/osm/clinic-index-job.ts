import { turkeyCities } from "../../config/turkey-cities";
import { prisma } from "../../lib/prisma";
import { getOsmClinicClient } from "./clinics";
import { upsertOsmClinicIndex } from "./clinic-index";

type IndexRunOptions = {
  city?: string | null;
  targetTotal?: number;
  maxCities?: number;
  source?: string;
};

const priorityCities = [
  "İstanbul",
  "Ankara",
  "İzmir",
  "Bursa",
  "Antalya",
  "Konya",
  "Adana",
  "Gaziantep",
  "Kocaeli",
  "Mersin",
  "Kayseri",
  "Samsun",
  "Eskişehir",
  "Diyarbakır",
  "Denizli",
  "Muğla",
  "Sakarya",
  "Tekirdağ",
  "Trabzon",
  "Manisa",
];

function normalize(value: string | null | undefined) {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function numberFromEnv(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, Math.trunc(parsed))) : fallback;
}

function orderedCities() {
  const byName = new Map(turkeyCities.map((city) => [normalize(city), city]));
  const ordered = priorityCities
    .map((city) => byName.get(normalize(city)))
    .filter((city): city is (typeof turkeyCities)[number] => Boolean(city));
  const seen = new Set(ordered.map(normalize));
  return [...ordered, ...turkeyCities.filter((city) => !seen.has(normalize(city)))];
}

async function currentIndexedCount() {
  try {
    return await prisma.osmClinicIndex.count();
  } catch {
    return 0;
  }
}

async function staleOrEmptyCities(limit: number) {
  const cityStats = await prisma.osmClinicIndex.groupBy({
    by: ["city"],
    _count: { city: true },
    _min: { lastSeenAt: true },
    where: { city: { not: null } },
  });
  const stats = new Map(cityStats.map((row) => [normalize(row.city), row]));
  return orderedCities()
    .map((city) => ({ city, stats: stats.get(normalize(city)) }))
    .sort((a, b) => {
      const aCount = a.stats?._count.city ?? 0;
      const bCount = b.stats?._count.city ?? 0;
      if (aCount === 0 && bCount !== 0) return -1;
      if (aCount !== 0 && bCount === 0) return 1;
      const aSeen = a.stats?._min.lastSeenAt?.getTime() ?? 0;
      const bSeen = b.stats?._min.lastSeenAt?.getTime() ?? 0;
      return aSeen - bSeen;
    })
    .slice(0, limit)
    .map(({ city }) => city);
}

export async function runOsmClinicIndexJob(options: IndexRunOptions = {}) {
  const targetTotal = options.targetTotal ?? numberFromEnv(process.env.OSM_INDEX_TARGET_TOTAL, 300, 1, 10_000);
  const maxCities = options.maxCities ?? numberFromEnv(process.env.OSM_INDEX_MAX_CITIES_PER_RUN, 8, 1, 81);
  const source = options.source ?? "openstreetmap-index-job";
  const city = options.city?.trim();
  const selectedCities = city ? [city] : await staleOrEmptyCities(maxCities);
  const client = getOsmClinicClient();
  const startedCount = await currentIndexedCount();
  const cityResults: Array<{ city: string; fetched: number; indexed: number; error?: string }> = [];
  let indexedWrites = 0;

  for (const selectedCity of selectedCities) {
    try {
      const clinics = await client.searchDentalClinics({ city: selectedCity, source: "internet" });
      const result = await upsertOsmClinicIndex(clinics, source);
      indexedWrites += result.count;
      cityResults.push({ city: selectedCity, fetched: clinics.length, indexed: result.count });
    } catch (error) {
      cityResults.push({
        city: selectedCity,
        fetched: 0,
        indexed: 0,
        error: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      });
    }

    const totalNow = await currentIndexedCount();
    if (!city && totalNow >= targetTotal) break;
  }

  const totalIndexedClinics = await currentIndexedCount();

  return {
    startedCount,
    totalIndexedClinics,
    targetTotal,
    reachedTarget: totalIndexedClinics >= targetTotal,
    indexedWrites,
    citiesProcessed: cityResults.length,
    cityResults,
  };
}
