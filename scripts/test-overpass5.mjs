/**
 * Test different Overpass instances and header combos
 */
const queries = [
  { name: "simple Content-Type", opts: { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "" } },
  { name: "with charset", opts: { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body: "" } },
];

async function testOverpass(name, options) {
  const q = `[out:json][timeout:10];node["amenity"="dentist"](41.0,28.5,41.2,29.2);out count;`;
  options.body = "data=" + encodeURIComponent(q);
  
  try {
    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      ...options,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await resp.text();
    console.log(`${name}: status=${resp.status}, body=${text.slice(0, 100)}`);
  } catch (e) {
    console.log(`${name}: ERROR ${e.message}`);
  }
  
  // Try alternative instance
  try {
    const resp = await fetch("https://overpass.kumi.systems/api/interpreter", {
      ...options,
      signal: AbortSignal.timeout(15_000),
    });
    const text = await resp.text();
    console.log(`${name} [kumi]: status=${resp.status}, body=${text.slice(0, 100)}`);
  } catch (e) {
    console.log(`${name} [kumi]: ERROR ${e.message}`);
  }
}

await testOverpass("no extra headers", { method: "POST", headers: {} });
await testOverpass("with accept json", { method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" } });
