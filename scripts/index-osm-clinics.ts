import { prisma } from "../src/lib/prisma";
import { runOsmClinicIndexJob } from "../src/services/osm/clinic-index-job";

function argValue(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

function numberArg(name: string, fallback: number) {
  const value = Number(argValue(name));
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

async function main() {
  const onlyCity = argValue("city");
  const result = await runOsmClinicIndexJob({
    city: onlyCity,
    targetTotal: numberArg("target-total", 300),
    maxCities: numberArg("limit-cities", 8),
    source: "openstreetmap-cli-index",
  });

  for (const cityResult of result.cityResults) {
    const suffix = cityResult.error ? ` error=${cityResult.error}` : "";
    console.log(`${cityResult.city}: ${cityResult.indexed}/${cityResult.fetched} indexed${suffix}`);
  }

  console.log(`Done. ${result.totalIndexedClinics}/${result.targetTotal} indexed clinics. Reached target: ${result.reachedTarget}`);
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
