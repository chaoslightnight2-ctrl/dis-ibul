/**
 * Test ALL Overpass query variations to find what works for Turkey dentists
 * Using kumi.systems which is more permissive
 */
const API = "https://overpass.kumi.systems/api/interpreter";
const UA = "DiscibulTest/1.0 (research)";
const BBOX = "41.0,28.5,41.2,29.2"; // Istanbul European

async function test(label, overpassQuery) {
  try {
    const resp = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA },
      body: "data=" + encodeURIComponent(overpassQuery),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) { console.log(`${label}: HTTP ${resp.status}`); return 0; }
    const text = await resp.text();
    if (text.includes("Error")) { console.log(`${label}: Query error`); return 0; }
    const data = JSON.parse(text);
    const els = data.elements || [];
    const named = els.filter(e => e.tags?.name).length;
    console.log(`${label}: ${els.length} total, ${named} named`);
    return named;
  } catch(e) {
    console.log(`${label}: ERROR ${e.message}`);
    return 0;
  }
}

async function main() {
  // Test 1: Current query (city)
  await test("CURRENT", `[out:json][timeout:30];(nwr["amenity"="dentist"](${BBOX});nwr["healthcare"="dentist"](${BBOX});nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology",i](${BBOX}););out center 500;`);

  // Test 2: Broader - add healthcare=clinic + speciality
  await test("BROADER", `[out:json][timeout:30];(nwr["amenity"="dentist"](${BBOX});nwr["healthcare"="dentist"](${BBOX});nwr["healthcare"~"dentist|clinic"][".*speciality.*"~"dentist|dental|oral",i](${BBOX}););out center 500;`);

  // Test 3: OR-based (one big union)
  await test("OR-BASED", `[out:json][timeout:30];(nwr[~"amenity|healthcare"~"dentist"](41.0,28.5,41.2,29.2););out center 500;`);

  // Test 4: Count only - how many in total?
  await test("COUNT", `[out:json][timeout:30];(nwr["amenity"="dentist"](${BBOX});nwr["healthcare"="dentist"](${BBOX}););out count;`);

  // Test 5: Any tag containing "dentist" anywhere
  await test("WILDCARD", `[out:json][timeout:30];(nwr[~".*"~"dentist|dental|dis",i](${BBOX}););out center 500;`);
  
  // Test 6: Focus on healthcare:speciality
  await test("SPECIALITY", `[out:json][timeout:30];(nwr["healthcare:speciality"~"dentist|dental|oral|implant|ortodonti|endodonti",i](${BBOX}););out center 500;`);
}

main();
