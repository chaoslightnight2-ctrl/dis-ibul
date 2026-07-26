import { turkeyCities } from "../src/config/turkey-cities";
import { prisma } from "../src/lib/prisma";
import { getOsmClinicClient } from "../src/services/osm/clinics";
import { upsertOsmClinicIndex } from "../src/services/osm/clinic-index";

function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function numberArg(name: string, fallback: number) {
  const value = Number(argValue(name));
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const onlyCity = argValue("city");
  const limitCities = numberArg("limit-cities", turkeyCities.length);
  const delayMs = numberArg("delay-ms", 1500);
  const cities = (onlyCity ? turkeyCities.filter((city) => city.toLocaleLowerCase("tr-TR") === onlyCity.toLocaleLowerCase("tr-TR")) : turkeyCities)
    .slice(0, limitCities);

  if (!cities.length) throw new Error(`City not found: ${onlyCity}`);

  const client = getOsmClinicClient();
  let total = 0;

  for (const [index, city] of cities.entries()) {
    const clinics = await client.searchDentalClinics({ city, source: "internet" });
    const result = await upsertOsmClinicIndex(clinics, "openstreetmap-city-index");
    total += result.count;
    console.log(`${index + 1}/${cities.length} ${city}: ${result.count} indexed`);
    if (index < cities.length - 1) await wait(delayMs);
  }

  console.log(`Done. ${total} clinic index writes across ${cities.length} cities.`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
