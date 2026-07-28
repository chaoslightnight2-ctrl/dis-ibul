import json
from pathlib import Path
from urllib.parse import quote

import duckdb
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

FILES = [f"C:/tmp/overture-tr-{part}.parquet" for part in ("w", "c1", "c2", "e")]
BOUNDARIES = Path("C:/tmp/turkey-provinces.geojson")
OUTPUT = Path("C:/tmp/overture-dental-clinics.json")

geojson = json.loads(BOUNDARIES.read_text(encoding="utf-8"))
province_shapes = [shape(feature["geometry"]) for feature in geojson["features"]]
province_names = [feature["properties"]["name"] for feature in geojson["features"]]
province_tree = STRtree(province_shapes)


def province_for(lon: float, lat: float) -> str | None:
    point = Point(lon, lat)
    for index in province_tree.query(point):
        if province_shapes[index].covers(point):
            return province_names[index]
    return None


rows = duckdb.connect().execute(
    """
    SELECT id, names.primary, categories.primary, confidence, addresses[1], websites, phones,
           (bbox.xmin + bbox.xmax) / 2 AS longitude,
           (bbox.ymin + bbox.ymax) / 2 AS latitude
      FROM read_parquet(?)
     WHERE addresses[1].country = 'TR'
       AND confidence >= 0.7
       AND (operating_status IS NULL OR operating_status <> 'closed')
       AND categories.primary IN (
         'dentist', 'cosmetic_dentist', 'general_dentistry', 'pediatric_dentist',
         'orthodontist', 'oral_surgeon', 'endodontist', 'periodontist', 'prosthodontist'
       )
       AND names.primary IS NOT NULL
    """,
    [FILES],
).fetchall()

clinics = []
seen = set()
for ident, name, category, confidence, address, websites, phones, lon, lat in rows:
    address = address or {}
    city = province_for(lon, lat)
    formatted = (address.get("freeform") or ", ".join(filter(None, [address.get("locality"), city]))).strip()
    if not city or not formatted:
        continue
    dedupe_key = (name.casefold().strip(), formatted.casefold(), city.casefold())
    if dedupe_key in seen:
        continue
    seen.add(dedupe_key)
    query = " ".join([name, formatted, city])
    clinics.append({
        "sourceRef": f"overture:{ident}", "name": name.strip(), "formattedAddress": formatted,
        "city": city, "district": address.get("locality"), "phone": phones[0] if phones else None,
        "latitude": lat, "longitude": lon,
        "websiteUrl": websites[0] if websites else None, "sourceName": "Overture Maps Places",
        "sourceUrl": "https://docs.overturemaps.org/guides/places/",
        "sourceUpdatedAt": "2026-07-22T00:00:00.000Z",
        "googleSearchUrl": "https://www.google.com/maps/search/?api=1&query=" + quote(query),
        "googleVisibilityStatus": "UNKNOWN",
    })

OUTPUT.write_text(json.dumps(clinics, ensure_ascii=False), encoding="utf-8")
print(json.dumps({"records": len(clinics), "cities": len({row["city"] for row in clinics})}, ensure_ascii=False))
