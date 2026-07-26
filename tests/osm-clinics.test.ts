import { describe, expect, it, vi } from "vitest";
import { OsmClinicClient, mapOsmClinic } from "@/services/osm/clinics";
import { filterOsmClinics } from "@/services/search/osm-clinic-filter";

const osmElement = {
  type: "node" as const,
  id: 123456,
  lat: 40.9901,
  lon: 29.0292,
  tags: {
    name: "Kadıköy Ağız ve Diş Sağlığı Kliniği",
    amenity: "dentist",
    "addr:street": "Bahariye Caddesi",
    "addr:housenumber": "10",
    "addr:district": "Kadıköy",
    "addr:city": "İstanbul",
    "contact:phone": "+90 216 000 00 00",
    "contact:website": "klinik.example",
    opening_hours: "Mo-Sa 09:00-19:00",
    "healthcare:speciality": "implantology;orthodontics",
    wheelchair: "yes",
  },
};

describe("OpenStreetMap clinic discovery", () => {
  it("maps community data to safe clinic cards and outbound links", () => {
    const clinic = mapOsmClinic(osmElement, { city: "İstanbul", district: "Kadıköy" });
    expect(clinic).toMatchObject({
      osmId: 123456,
      name: "Kadıköy Ağız ve Diş Sağlığı Kliniği",
      city: "İstanbul",
      district: "Kadıköy",
      wheelchairAccess: true,
      websiteUrl: "https://klinik.example/",
    });
    expect(clinic?.osmUrl).toBe("https://www.openstreetmap.org/node/123456");
    expect(clinic?.googleSearchUrl).toContain("google.com/maps/search/");
    expect(clinic?.specialties).toEqual(["İmplantoloji", "Ortodonti"]);
  });

  it("uses one bounded Nominatim lookup followed by an Overpass dentist query", async () => {
    const fetcher = vi.fn(async (input: string | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("nominatim")) {
        return new Response(JSON.stringify([{ boundingbox: ["40.85", "41.10", "28.70", "29.30"] }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      expect(String(init?.body)).toContain("amenity%22%3D%22dentist");
      return new Response(JSON.stringify({ elements: [osmElement] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    const client = new OsmClinicClient(fetcher, false, false);
    const clinics = await client.searchDentalClinics({ city: "İstanbul", district: "Kadıköy" });

    expect(clinics).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const [nominatimUrl, nominatimInit] = fetcher.mock.calls[0];
    expect(String(nominatimUrl)).toContain("q=Kad%C4%B1k%C3%B6y%2C+%C4%B0stanbul%2C+T%C3%BCrkiye");
    expect(new Headers(nominatimInit?.headers).get("User-Agent")).toContain("Discibul/0.5");
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get("Content-Type")).toContain("application/x-www-form-urlencoded");
  });

  it("does not claim ratings, prices or live opening state for community results", () => {
    const clinic = mapOsmClinic(osmElement, { city: "İstanbul", district: "Kadıköy" });
    expect(filterOsmClinics(clinic ? [clinic] : [], { treatment: "implant" })).toHaveLength(1);
    expect(filterOsmClinics(clinic ? [clinic] : [], { minGoogleRating: 4.5 })).toHaveLength(0);
  });
});
