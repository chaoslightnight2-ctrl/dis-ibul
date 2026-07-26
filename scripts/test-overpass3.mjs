/**
 * Overpass test with proper headers (matching the existing code)
 */
async function run() {
  const bbox = "41.0,28.5,41.2,29.2";
  
  // Match the EXACT query format from clinics.ts
  const query = `[out:json][timeout:30];(
    nwr["amenity"="dentist"](${bbox});
    nwr["healthcare"="dentist"](${bbox});
    nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology",i](${bbox});
  );out center 200;`;
  
  console.log("Query length:", query.length);
  
  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Accept": "application/json",
    },
    body: "data=" + encodeURIComponent(query),
    signal: AbortSignal.timeout(35_000),
  });
  
  console.log("Status:", resp.status);
  
  if (!resp.ok) {
    const text = await resp.text();
    console.log("Error response:", text.slice(0, 300));
    return;
  }
  
  const data = await resp.json();
  const elements = data.elements || [];
  const withName = elements.filter(e => e.tags?.name);
  
  console.log("Toplam eleman:", elements.length);
  console.log("İsimli klinik:", withName.length);
  
  // Tag analysis
  const tags = {};
  for (const el of elements) {
    const t = el.tags || {};
    const key = `amenity=${t.amenity || "-"} healthcare=${t.healthcare || "-"} healthcare:speciality=${t["healthcare:speciality"] || "-"}`;
    tags[key] = (tags[key] || 0) + 1;
  }
  
  console.log("\nTag dağılımı:");
  Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([tag, count]) => console.log(`  ${tag}: ${count}`));
  
  // Check for clinics without name
  const noName = elements.filter(e => !e.tags?.name);
  console.log(`\nİsimsiz eleman: ${noName.length}`);
}

run().catch(e => console.error("FAIL:", e.message));
