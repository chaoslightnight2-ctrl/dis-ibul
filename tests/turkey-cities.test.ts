import { describe, expect, it } from "vitest";
import { isTurkeyCity, turkeyCities } from "@/config/turkey-cities";

describe("Turkey-wide city search", () => {
  it("contains all 81 unique provinces", () => {
    expect(turkeyCities).toHaveLength(81);
    expect(new Set(turkeyCities).size).toBe(81);
    expect(turkeyCities).toEqual(expect.arrayContaining(["İstanbul", "Ankara", "İzmir", "Şırnak", "Düzce"]));
  });

  it("validates province names with Turkish casing", () => {
    expect(isTurkeyCity("istanbul")).toBe(true);
    expect(isTurkeyCity(" ŞANLIURFA ")).toBe(true);
    expect(isTurkeyCity("Berlin")).toBe(false);
  });
});
