import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoogleRatingBadge } from "@/components/google/google-rating-badge";
import { GET as getSingleRating } from "@/app/api/google/rating/route";
import { POST as getBatchRatings } from "@/app/api/google/ratings/route";
import { NextRequest } from "next/server";

describe("Google-free fallback", () => {
  it("shows a direct Google Maps search link without a loading or fake rating state", () => {
    render(<GoogleRatingBadge clinicName="Örnek Diş Kliniği" city="İstanbul" />);

    const link = screen.getByRole("link");
    expect(link.textContent).toContain("Google yorumlarını gör");
    expect(link.getAttribute("href")).toContain("https://www.google.com/maps/search/?api=1");
    expect(screen.queryByText(/Puan alınıyor/i)).toBeNull();
  });

  it("returns null rating data without contacting Google", async () => {
    const request = new NextRequest(
      "http://localhost/api/google/rating?name=Örnek%20Diş%20Kliniği&city=İstanbul",
    );
    const response = await getSingleRating(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      rating: null,
      reviewCount: null,
      sourceUrl: null,
      provider: "google-free-fallback",
    });
  });

  it("keeps the legacy batch contract while returning only unknown ratings", async () => {
    const request = new NextRequest("http://localhost/api/google/ratings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clinics: [["Örnek Diş Kliniği", "İstanbul"]] }),
    });
    const response = await getBatchRatings(request);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      results: { "Örnek Diş Kliniği|İstanbul": null },
      provider: "google-free-fallback",
    });
  });
});