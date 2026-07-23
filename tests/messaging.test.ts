import { describe, expect, it } from "vitest";
import {
  appointmentStatusCopy,
  messageBodySchema,
  messagePreview,
  messagingPath,
  notificationPath,
} from "../src/domain/messaging";

describe("messaging validation and navigation", () => {
  it("accepts a trimmed message and rejects empty or oversized bodies", () => {
    expect(messageBodySchema.parse({ body: "  Merhaba  " }).body).toBe("Merhaba");
    expect(messageBodySchema.safeParse({ body: "   " }).success).toBe(false);
    expect(messageBodySchema.safeParse({ body: "x".repeat(2_001) }).success).toBe(false);
  });

  it("builds role-specific internal links and safely encodes conversation ids", () => {
    expect(messagingPath("patient", "abc&next=/admin")).toBe("/panel/hasta/mesajlar?konusma=abc%26next%3D%2Fadmin");
    expect(messagingPath("clinic", "conversation-1")).toBe("/panel/klinik/mesajlar?konusma=conversation-1");
    expect(notificationPath("patient")).toBe("/panel/hasta/bildirimler");
    expect(notificationPath("clinic")).toBe("/panel/klinik/bildirimler");
  });

  it("provides patient-facing copy for every clinic status transition", () => {
    for (const status of [
      "VIEWED_BY_CLINIC",
      "INFO_REQUESTED",
      "APPROVED",
      "ALTERNATIVE_TIME_PROPOSED",
      "CANCELLED",
      "COMPLETED",
      "NO_SHOW",
    ]) {
      expect(appointmentStatusCopy[status]?.title.length).toBeGreaterThan(5);
      expect(appointmentStatusCopy[status]?.body.length).toBeGreaterThan(5);
    }
  });

  it("normalizes whitespace and limits notification previews", () => {
    expect(messagePreview("Merhaba\n\n nasılsınız?")).toBe("Merhaba nasılsınız?");
    expect(messagePreview("x".repeat(150))).toHaveLength(120);
    expect(messagePreview("x".repeat(150)).endsWith("…")).toBe(true);
  });
});
