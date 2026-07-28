import json
from pathlib import Path
from urllib.parse import quote
import duckdb

files = [f"C:/tmp/overture-tr-{part}.parquet" for part in ("w", "c1", "c2", "e")]
rows = duckdb.connect().execute("""
SELECT id, names.primary, categories.primary, confidence, addresses[1], websites, phones
FROM read_parquet(?)
WHERE addresses[1].country='TR' AND confidence>=0.7
  AND (operating_status IS NULL OR operating_status <> 'closed')
  AND categories.primary IN ('dentist','cosmetic_dentist','general_dentistry','pediatric_dentist','orthodontist','oral_surgeon','endodontist','periodontist','prosthodontist')
  AND names.primary IS NOT NULL
""", [files]).fetchall()

out=[]
for ident,name,category,confidence,address,websites,phones in rows:
    address=address or {}
    city=(address.get('region') or address.get('locality') or '').strip()
    formatted=(address.get('freeform') or ', '.join(filter(None,[address.get('locality'),address.get('region')]))).strip()
    if not city or not formatted: continue
    q=' '.join([name,formatted,city])
    out.append({'sourceRef':f'overture:{ident}','name':name.strip(),'formattedAddress':formatted,'city':city,'district':address.get('locality'),'phone':phones[0] if phones else None,'websiteUrl':websites[0] if websites else None,'sourceName':'Overture Maps Places','sourceUrl':'https://docs.overturemaps.org/guides/places/','sourceUpdatedAt':'2026-07-22T00:00:00.000Z','googleSearchUrl':'https://www.google.com/maps/search/?api=1&query='+quote(q),'googleVisibilityStatus':'UNKNOWN','sourceCategory':category,'sourceConfidence':confidence})
Path('C:/tmp/overture-dental-clinics.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'records':len(out)},ensure_ascii=False))
