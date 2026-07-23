import { describe, expect, it } from "vitest";
import { clinicFixtures } from "@/data/clinics";
import { clinicSearchSchema } from "@/domain/validation";
import { filterClinics } from "@/services/search/clinic-filter";

const searchClinics = (filters: Parameters<typeof filterClinics>[1]) => filterClinics(clinicFixtures, filters);

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

  it("does not use example Google values as live rating filters", () => {
    expect(searchClinics({ minGoogleRating: 4 })).toHaveLength(0);
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

  it("filters clinics with free initial exams", () => {
    const filters = clinicSearchSchema.parse({ freeInitialExam: "true" });
    const results = searchClinics(filters);
    expect(results).toHaveLength(1);
    expect(results[0].slug).toBe("mavi-gulus-klinigi");
  });

  it("filters clinics by maximum initial exam fee", () => {
    const filters = clinicSearchSchema.parse({ maxExamFee: "500" });
    const results = searchClinics(filters);
    expect(results.map((clinic) => clinic.slug)).toEqual(["mavi-gulus-klinigi", "ege-cocuk-dis"]);
  });
});
