#!/usr/bin/env python3
"""Import Turkish dental clinics from the Geofabrik PBF into DişçiBul.

Requires: pip install osmium requests
The public application never calls Overpass; this is an operator-run batch job.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
import time
import unicodedata
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import osmium
import requests

GEOFABRIK_URL = "https://download.geofabrik.de/europe/turkey-latest.osm.pbf"
GEOFABRIK_MD5_URL = GEOFABRIK_URL + ".md5"
DEFAULT_ENDPOINT = "https://dis-ibul.vercel.app/api/admin/osm-index/bulk"
USER_AGENT = "Discibul/0.5 (https://dis-ibul.vercel.app)"
DENTAL_WORDS = re.compile(r"\b(di[sş]|di[sş][cç]i|dental|dentist|a[gğ][iı]z\s*(ve|&)\s*di[sş])\b", re.I)
EXCLUDED_WORDS = re.compile(r"\b(laboratuvar|laboratory|lab\.?|malzeme|depo|teknik|teknisyen|veteriner|veterinary)\b", re.I)
DENTAL_SPECIALTIES = {
    "dentistry", "dentist", "implantology", "orthodontics", "endodontics",
    "pediatric_dentistry", "periodontics", "stomatology", "oral_surgery",
    "oral_dentistry", "prosthodontics",
}


def normalized(value: str | None) -> str:
    text = unicodedata.normalize("NFKD", (value or "").strip().casefold())
    return "".join(ch for ch in text if not unicodedata.combining(ch)).replace("ı", "i")


def clean_name(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    letters = [ch for ch in value if ch.isalpha()]
    if letters and sum(ch.isupper() for ch in letters) / len(letters) > 0.85:
        return value.title()
    return value


def clean_phone(value: str | None) -> str | None:
    if not value:
        return None
    first = re.split(r"[;,/]", value)[0].strip()
    digits = re.sub(r"\D", "", first)
    if digits.startswith("0090"):
        digits = digits[2:]
    elif len(digits) == 10 and digits[0] in "2345":
        digits = "90" + digits
    elif len(digits) == 11 and digits.startswith("0"):
        digits = "9" + digits
    return "+" + digits if len(digits) == 12 and digits.startswith("90") else first[:200]


def clean_website(value: str | None) -> str | None:
    if not value:
        return None
    candidate = value.strip().split()[0]
    if not re.match(r"^https?://", candidate, re.I):
        candidate = "https://" + candidate
    try:
        parts = urlsplit(candidate)
        if parts.scheme not in {"http", "https"} or not parts.netloc:
            return None
        if any(host in parts.netloc.casefold() for host in ("facebook.com", "instagram.com", "x.com", "twitter.com")):
            return None
        query = [(key, val) for key, val in parse_qsl(parts.query) if not key.casefold().startswith("utm_")]
        return urlunsplit((parts.scheme.casefold(), parts.netloc.casefold(), re.sub(r"/{2,}", "/", parts.path), urlencode(query), ""))
    except ValueError:
        return None


def is_dental(tags: dict[str, str]) -> bool:
    lifecycle = " ".join(f"{key}={value}" for key, value in tags.items() if key.startswith(("disused", "abandoned", "demolished", "razed")))
    if lifecycle or tags.get("operational_status") in {"closed", "disused"}:
        return False
    name_blob = " ".join(filter(None, (tags.get("name"), tags.get("official_name"), tags.get("operator"), tags.get("description"))))
    if EXCLUDED_WORDS.search(name_blob) or tags.get("healthcare") in {"laboratory", "veterinary"}:
        return False
    if tags.get("craft") in {"dental_technician", "dental_laboratory"} or tags.get("shop") in {"medical_supply", "dental_supply"}:
        return False
    if tags.get("amenity") == "dentist" or tags.get("healthcare") == "dentist" or tags.get("office") == "dentist":
        return True
    specialties = {normalized(item) for item in tags.get("healthcare:speciality", "").split(";")}
    if specialties & {normalized(item) for item in DENTAL_SPECIALTIES}:
        return True
    clinic = tags.get("healthcare") == "clinic" or tags.get("amenity") == "clinic"
    return bool(clinic and DENTAL_WORDS.search(name_blob))


def read_city_names(repo: Path) -> list[str]:
    source = (repo / "src/config/turkey-cities.ts").read_text(encoding="utf-8")
    block = source.split("export const turkeyCities = [", 1)[1].split("] as const", 1)[0]
    return re.findall(r'^\s*"([^"]+)",?\s*$', block, re.M)


def geocode_city_centers(cities: list[str], cache_path: Path) -> dict[str, tuple[float, float]]:
    if cache_path.exists():
        raw = json.loads(cache_path.read_text(encoding="utf-8"))
        if all(city in raw for city in cities):
            return {city: (float(raw[city][0]), float(raw[city][1])) for city in cities}
    centers: dict[str, tuple[float, float]] = {}
    session = requests.Session()
    for city in cities:
        response = session.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": f"{city}, Türkiye", "format": "jsonv2", "limit": 1, "countrycodes": "tr"},
            headers={"User-Agent": USER_AGENT, "Accept-Language": "tr"}, timeout=20,
        )
        response.raise_for_status()
        hits = response.json()
        if hits:
            centers[city] = (float(hits[0]["lat"]), float(hits[0]["lon"]))
        time.sleep(1.05)
    cache_path.write_text(json.dumps(centers, ensure_ascii=False, indent=2), encoding="utf-8")
    return centers


def resolve_city(raw: str | None, lat: float, lon: float, cities: list[str], centers: dict[str, tuple[float, float]]) -> str | None:
    candidate = normalized(re.sub(r"\b(ili|province|buyuksehir belediyesi)\b", "", raw or "", flags=re.I))
    aliases = {normalized(city): city for city in cities}
    if candidate in aliases:
        return aliases[candidate]
    if not centers:
        return None
    return min(centers, key=lambda city: (lat - centers[city][0]) ** 2 + ((lon - centers[city][1]) * math.cos(math.radians(lat))) ** 2)


def address_from(tags: dict[str, str], city: str | None) -> str:
    street = " ".join(filter(None, (tags.get("addr:street"), tags.get("addr:housenumber"))))
    parts = [street, tags.get("addr:neighbourhood") or tags.get("addr:quarter") or tags.get("addr:suburb"), tags.get("addr:district"), city]
    return ", ".join(dict.fromkeys(item.strip() for item in parts if item and item.strip())) or "Adres OpenStreetMap üzerinde görüntülenebilir."


class DentistHandler(osmium.SimpleHandler):
    def __init__(self, cities: list[str], centers: dict[str, tuple[float, float]], limit: int | None = None):
        super().__init__()
        self.cities, self.centers, self.limit = cities, centers, limit
        self.records: dict[str, dict[str, Any]] = {}
        self.stats = Counter()

    def node(self, item: Any) -> None:
        if item.location.valid():
            self._accept("node", item.id, dict(item.tags), item.location.lat, item.location.lon)

    def way(self, item: Any) -> None:
        coords = [(node.location.lat, node.location.lon) for node in item.nodes if node.location.valid()]
        if coords:
            self._accept("way", item.id, dict(item.tags), sum(p[0] for p in coords) / len(coords), sum(p[1] for p in coords) / len(coords))

    def _accept(self, osm_type: str, osm_id: int, tags: dict[str, str], lat: float, lon: float) -> None:
        self.stats["processed"] += 1
        if self.limit and len(self.records) >= self.limit:
            return
        if not is_dental(tags):
            return
        self.stats["dental"] += 1
        name = clean_name(tags.get("name") or tags.get("official_name") or tags.get("short_name") or tags.get("alt_name") or tags.get("operator") or "")
        if not name or len(normalized(name)) < 3 or not any(char.isalpha() for char in name):
            self.stats["missing_name"] += 1
            return
        city = resolve_city(tags.get("addr:city") or tags.get("addr:province"), lat, lon, self.cities, self.centers)
        district = tags.get("addr:district") or tags.get("addr:suburb") or tags.get("addr:town") or tags.get("addr:county")
        address = address_from(tags, city)
        ref = f"{osm_type}/{osm_id}"
        specialties = [part.strip().replace("_", " ") for part in tags.get("healthcare:speciality", "").split(";") if part.strip()][:30]
        query = " ".join(filter(None, (name, district, city, address)))
        self.records[ref] = {
            "osmType": osm_type, "osmId": osm_id, "name": name, "formattedAddress": address,
            "city": city, "district": district, "latitude": round(lat, 6), "longitude": round(lon, 6),
            "phone": clean_phone(tags.get("contact:phone") or tags.get("contact:mobile") or tags.get("phone")),
            "websiteUrl": clean_website(tags.get("contact:website") or tags.get("website")),
            "openingHours": tags.get("opening_hours"),
            "wheelchairAccess": True if tags.get("wheelchair") == "yes" else False if tags.get("wheelchair") == "no" else None,
            "specialties": specialties, "osmUrl": f"https://www.openstreetmap.org/{ref}",
            "googleSearchUrl": "https://www.google.com/maps/search/?api=1&" + urlencode({"query": query}),
        }


def scan_pbf(pbf: Path, cities: list[str], centers: dict[str, tuple[float, float]], limit: int | None) -> DentistHandler:
    handler = DentistHandler(cities, centers, limit)
    processor = (
        osmium.FileProcessor(str(pbf))
        .with_locations("flex_mem")
        .with_filter(osmium.filter.KeyFilter("amenity", "healthcare", "office", "healthcare:speciality", "craft", "shop"))
    )
    for item in processor:
        kind = item.type_str()
        if kind == "n" and item.location.valid():
            handler._accept("node", item.id, dict(item.tags), item.location.lat, item.location.lon)
        elif kind == "w":
            coords = [(node.location.lat, node.location.lon) for node in item.nodes if node.location.valid()]
            if coords:
                handler._accept("way", item.id, dict(item.tags), sum(point[0] for point in coords) / len(coords), sum(point[1] for point in coords) / len(coords))
        if handler.stats["processed"] and handler.stats["processed"] % 100_000 == 0:
            print(f"filtered objects {handler.stats['processed']:,}; dental {handler.stats['dental']:,}", flush=True)
    return handler


def file_md5(path: Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download(url: str, target: Path) -> None:
    expected_response = requests.get(GEOFABRIK_MD5_URL, headers={"User-Agent": USER_AGENT}, timeout=30)
    expected_response.raise_for_status()
    expected = expected_response.text.strip().split()[0].casefold()
    if target.exists() and file_md5(target) == expected:
        return
    if target.exists():
        target.replace(target.with_suffix(target.suffix + ".invalid"))

    partial = target.with_suffix(target.suffix + ".part")
    marker = target.with_suffix(target.suffix + ".part.md5")
    if partial.exists() and (not marker.exists() or marker.read_text(encoding="ascii").strip() != expected):
        partial.unlink()
    marker.write_text(expected, encoding="ascii")
    existing = partial.stat().st_size if partial.exists() else 0
    headers = {"User-Agent": USER_AGENT}
    if existing:
        headers["Range"] = f"bytes={existing}-"
    with requests.get(url, headers=headers, stream=True, timeout=(20, 120)) as response:
        response.raise_for_status()
        resumed = existing > 0 and response.status_code == 206
        with partial.open("ab" if resumed else "wb") as output:
            done = existing if resumed else 0
            total = int(response.headers.get("content-length", 0)) + (existing if resumed else 0)
            for chunk in response.iter_content(1024 * 1024):
                if chunk:
                    output.write(chunk)
                    done += len(chunk)
                    if done % (50 * 1024 * 1024) < len(chunk):
                        print(f"downloaded {done / 1024 / 1024:.0f}/{total / 1024 / 1024:.0f} MB", flush=True)
    actual = file_md5(partial)
    if actual != expected:
        raise RuntimeError(f"PBF checksum mismatch: expected {expected}, got {actual}")
    partial.replace(target)
    marker.unlink(missing_ok=True)


def upload(records: list[dict[str, Any]], endpoint: str, token: str) -> int:
    session, written = requests.Session(), 0
    for start in range(0, len(records), 100):
        batch = records[start:start + 100]
        response = session.post(endpoint, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json={"clinics": batch}, timeout=90)
        response.raise_for_status()
        written += int(response.json().get("imported", 0))
        print(f"uploaded {min(start + 100, len(records))}/{len(records)}", flush=True)
    return written


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--pbf", type=Path, default=Path(r"C:\tmp\turkey-latest.osm.pbf"))
    parser.add_argument("--endpoint", default=DEFAULT_ENDPOINT)
    parser.add_argument("--token-file", type=Path)
    parser.add_argument("--city-cache", type=Path, default=Path(r"C:\tmp\discibul-city-centers.json"))
    parser.add_argument("--report", type=Path, default=Path(r"C:\tmp\discibul-osm-import-report.json"))
    parser.add_argument("--limit", type=int)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--skip-download", action="store_true", help="Use an existing PBF file without checking the remote checksum.")
    parser.add_argument("--confirm-production", action="store_true")
    args = parser.parse_args()

    if not args.skip_download:
        download(GEOFABRIK_URL, args.pbf)
    elif not args.pbf.exists():
        raise FileNotFoundError(f"PBF file not found: {args.pbf}")
    cities = read_city_names(args.repo)
    centers = geocode_city_centers(cities, args.city_cache)
    started = time.time()
    handler = scan_pbf(args.pbf, cities, centers, args.limit)
    records = list(handler.records.values())
    city_counts = Counter(record["city"] or "UNKNOWN" for record in records)
    written = 0
    if not args.dry_run:
        if args.endpoint == DEFAULT_ENDPOINT and not args.confirm_production:
            raise SystemExit("--confirm-production is required for the production endpoint")
        if not args.token_file or not args.token_file.exists():
            raise SystemExit("--token-file is required unless --dry-run is used")
        written = upload(records, args.endpoint, args.token_file.read_text(encoding="utf-8").strip())
    report = {
        "source": GEOFABRIK_URL, "startedAt": started, "finishedAt": time.time(),
        "processedObjects": handler.stats["processed"], "dentalCandidates": handler.stats["dental"],
        "accepted": len(records), "missingName": handler.stats["missing_name"], "uploaded": written,
        "withPhone": sum(bool(row["phone"]) for row in records), "withWebsite": sum(bool(row["websiteUrl"]) for row in records),
        "withOpeningHours": sum(bool(row["openingHours"]) for row in records),
        "license": "ODbL-1.0",
        "cityCounts": {city: city_counts.get(city, 0) for city in cities} | ({"UNKNOWN": city_counts["UNKNOWN"]} if city_counts["UNKNOWN"] else {}),
    }
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
