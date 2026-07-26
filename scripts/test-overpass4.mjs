/**
 * Overpass - exact headers match of the app
 */
async function run() {
  const bbox = "41.0,28.5,41.2,29.2";
  const query = `[out:json][timeout:30];(
    nwr["amenity"="dentist"](${bbox});
    nwr["healthcare"="dentist"](${bbox});
    nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology",i](${bbox});
  );out center 200;`;

  const resp = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Language": "tr-TR,tr;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Referer": "https://discibul.example",
      "User-Agent": "Discibul/0.5 (https://discibul.example)",
    },
    body: "data=" + encodeURIComponent(query),
    signal: AbortSignal.timeout(35_000),
  });
  
  console.log("Status:", resp.status);
  const text = await resp.text();
  
  if (!resp.ok) {
    console.log("Error:", text.slice(0, 300));
    return;
  }
  
  const data = JSON.parse(text);
  console.log("Elements:", data.elements?.length || 0);
  const withName = data.elements?.filter(e => e.tags?.name) || [];
  console.log("Named:", withName.length);
  
  // broot query - find what tags exist in Turkey for dentists
  console.log("\n--- Finding ALL dentist tags in Turkey ---");
  const trQuery = `[out:json][timeout:45][maxsize:50000000];(area["ISO3166-1"="TR"][admin_level=2];nwr["amenity"="dentist"](area);nwr["healthcare"="dentist"](area););out tags 1000;`;
  
  const resp2 = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Accept-Language": "tr-TR,tr;q=0.9",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: "data=" + encodeURIComponent(trQuery),
    signal: AbortSignal.timeout(50_000),
  });
  
  if (resp2.ok) {
    const d2 = JSON.parse(await resp2.text());
    const els = d2.elements || [];
    console.log("Turkey total dentist-tagged:", els.length);
    
    // Find speciality tags used
    const specialities = new Set();
    for (const el of els) {
      const sp = el.tags?.["healthcare:speciality"];
      if (sp) sp.split(";").forEach(s => specialities.add(s.trim()));
    }
    console.log("Used healthcare:speciality values:", [...specialities]);
    
    // Count by primary tag
    const byTag = {};
    for (const el of els) {
      const key = el.tags?.amenity || el.tags?.healthcare || "other";
      byTag[key] = (byTag[key] || 0) + 1;
    }
    console.log("By tag:", byTag);
  }
}

run().catch(e => console.error("FAIL:", e.message));
