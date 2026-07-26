/**
 * Simple Overpass test - find dental clinics in Istanbul
 */
async function run() {
  const bbox = "41.0,28.5,41.2,29.2"; // İstanbul Avrupa
  
  // Simplest possible query
  const query = `[out:json][timeout:25];node["amenity"="dentist"](${bbox});out;`;
  
  console.log("Query:", query);
  
  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "data=" + encodeURIComponent(query),
    signal: AbortSignal.timeout(30_000),
  });
  
  console.log("Status:", resp.status);
  const text = await resp.text();
  console.log("Response starts with:", text.slice(0, 100));
  
  try {
    const data = JSON.parse(text);
    console.log("Elements:", data.elements?.length || 0);
    const names = data.elements?.filter(e => e.tags?.name).map(e => e.tags.name) || [];
    console.log("Named:", names.length);
    names.slice(0, 5).forEach(n => console.log(" -", n));
  } catch {
    console.log("Response is NOT JSON - it's HTML");
    console.log("Full response:", text.slice(0, 500));
  }
}

run().catch(e => console.error("FAIL:", e.message));
