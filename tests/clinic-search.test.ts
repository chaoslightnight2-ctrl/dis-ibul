import { describe, expect, it } from "vitest";
import { clinicSearchSchema } from "@/domain/validation";
import { searchClinics } from "@/services/search/clinic-search";

describe("clinic search", () => {
  it("filters by city and treatment", () => {
    const results = searchClinics({ city: "İstanbul", treatment: "implant" });
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("mavi-gulus-klinigi");
  });

  it("does not invent google ratings when sync failed", () => {
    const results = searchClinics({ city: "İzmir" });
    expect(results[0].google.rating).toBeNull();
    expect(results[0].google.syncStatus).toBe("FAILED");
  });

  it("sorts sponsored labels without hiding them", () => {
    const results = searchClinics({ sort: "lowest-price" });
    expect(results.some((clinic) => clinic.sponsored)).toBe(true);
    expect(results.find((clinic) => clinic.sponsored)?.slug).toBe("nova-dent-agiz-dis-sagligi");
  });

  it("does not treat empty query numbers as zero-price filters", () => {
    const filters = clinicSearchSchema.parse({ city: "İstanbul", maxPrice: "" });
    expect(filters.maxPrice).toBeUndefined();
    expect(searchClinics(filters)).toHaveLength(1);
  });

  it("parses explicit false query booleans as false", () => {
    const filters = clinicSearchSchema.parse({ verifiedOnly: "false", openNow: "false" });
    expect(filters.verifiedOnly).toBe(false);
    expect(filters.openNow).toBe(false);
  });
});
