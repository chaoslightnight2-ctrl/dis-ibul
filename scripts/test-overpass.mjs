/**
 * Overpass API'yi test et — İstanbul'daki diş kliniklerini say.
 */
const OSM_TAGS = {
  // Şu anki sorguda kullanılan tag'ler
  current: [
    `nwr["amenity"="dentist"]`,
    `nwr["healthcare"="dentist"]`,
    `nwr["healthcare"="clinic"]["healthcare:speciality"~"dentistry|dentist|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology|oral_surgery",i]`,
    `nwr["amenity"="clinic"]["healthcare:speciality"~"dentistry|dentist|implantology|orthodontics|endodontics|pediatric_dentistry|periodontics|stomatology|oral_surgery",i]`,
  ],
  // Eklenebilecek tag'ler
  extra: [
    `nwr["healthcare:speciality"="dentistry"]`,
    `nwr["healthcare:speciality"="dentist"]`,
    `nwr["healthcare:speciality"="implantology"]`,
    `nwr["healthcare:speciality"="orthodontics"]`,
    `nwr["healthcare"="clinic"]["clinic:dentist"="yes"]`,
    `nwr["amenity":"dentist"]`,  // alternative syntax
  ],
};

const BBOX = "41.0,28.5,41.2,29.2"; // İstanbul Avrupa yakası

async function testQuery(label, tagLines) {
  const query = `[out:json][timeout:30];(${tagLines.join(";")});out center 1000;`;
  const url = "https://overpass-api.de/api/interpreter";
  
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(35_000),
    });
    const data = await resp.json();
    const elements = data.elements || [];
    const withName = elements.filter((e) => e.tags?.name);
    
    // Tag dağılımı
    const tagCounts = {};
    for (const el of elements) {
      const t = el.tags || {};
      const key = `${t.amenity || "-"} / ${t.healthcare || "-"} / ${t["healthcare:speciality"] || "-"}`;
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    }
    
    console.log(`\n=== ${label} ===`);
    console.log(`Toplam: ${elements.length}, İsimli: ${withName.length}`);
    console.log("Tag dağılımı (ilk 10):");
    Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([tag, count]) => console.log(`  ${tag}: ${count}`));
    
    return withName.length;
  } catch (e) {
    console.log(`\n=== ${label} === HATA: ${e.message}`);
    return 0;
  }
}

async function main() {
  console.log("BBOX:", BBOX);
  console.log("=".repeat(60));
  
  // Test 1: Sadece mevcut tag'ler
  await testQuery("MEVCUT TAG'LER", OSM_TAGS.current);
  
  // Test 2: Türkiye'deki en yaygın diş klinik tag'lerini bul
  console.log("\n" + "=".repeat(60));
  console.log("Türkiye geneli tag analizi:");
  const trQuery = `[out:json][timeout:45][maxsize:50000000];(area["ISO3166-1"="TR"][admin_level=2];nwr["amenity"="dentist"](area);nwr["healthcare"="dentist"](area););out count;`;
  
  try {
    const resp = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(trQuery)}`,
      signal: AbortSignal.timeout(50_000),
    });
    const data = await resp.json();
    console.log("Türkiye'deki toplam dentist etiketi:", JSON.stringify(data));
  } catch (e) {
    console.log("Türkiye sorgusu hatası:", e.message);
  }
}

main();
