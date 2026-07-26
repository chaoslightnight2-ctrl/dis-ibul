/**
 * Final Overpass test - proper query format
 */
async function run() {
  // Build query EXACTLY like clinics.ts does
  const bbox = "41.0,28.5,41.2,29.2";
  const query = `[out:json][timeout:30];(
    nwr["amenity"="dentist"](${bbox});
    nwr["healthcare"="dentist"](${bbox});
    nwr["healthcare"="clinic"]["healthcare:speciality"~"dentistry|dentist|implantology",i](${bbox});
    nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|dentist|implantology",i](${bbox});
  );out center 500;`;

  console.log("Sending query...");
  
  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Accept": "application/json",
      "User-Agent": "Discibul/0.5 (https://discibul.example)",
    },
    body: "data=" + encodeURIComponent(query),
    signal: AbortSignal.timeout(35_000),
  });

  console.log("Status:", resp.status);
  const text = await resp.text();
  
  if (text.includes("Error") || text.includes("<!DOCTYPE")) {
    console.log("ERROR response:", text.slice(0, 400));
    return;
  }

  try {
    const data = JSON.parse(text);
    const els = data.elements || [];
    console.log("Elements:", els.length);
    
    const withName = els.filter(e => e.tags?.name);
    console.log("With name:", withName.length);
    
    // Show tag distribution
    const tagDist = {};
    for (const el of els) {
      const t = el.tags || {};
      const key = `${t.amenity || "-"}/${t.healthcare || "-"}`;
      tagDist[key] = (tagDist[key] || 0) + 1;
    }
    console.log("Tag distribution:", tagDist);
    
    // Show first 5 names
    withName.slice(0, 5).forEach(e => console.log("  -", e.tags.name));
  } catch (e) {
    console.log("Parse error:", e.message);
    console.log("Raw:", text.slice(0, 300));
  }

  // Also try kumi.systems as fallback
  console.log("\n--- Trying kumi.systems ---");
  try {
    const resp2 = await fetch("https://overpass.kumi.systems/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Discibul/0.5 (test)",
      },
      body: "data=" + encodeURIComponent(query),
      signal: AbortSignal.timeout(35_000),
    });
    const text2 = await resp2.text();
    if (text2.includes("Error") || text2.includes("<!DOCTYPE")) {
      console.log("ERROR:", text2.slice(0, 200));
    } else {
      const data2 = JSON.parse(text2);
      console.log("Elements:", data2.elements?.length || 0);
    }
  } catch (e2) {
    console.log("FAIL:", e2.message);
  }
}

run().catch(e => console.error("CRASH:", e.message));
