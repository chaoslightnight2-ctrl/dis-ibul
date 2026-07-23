import { describe, expect, it } from "vitest";
import { getContactLinks, normalizeTurkeyPhone } from "@/lib/contact-links";

describe("clinic contact links", () => {
  it("normalizes Turkish local and international phone numbers", () => {
    expect(normalizeTurkeyPhone("0532 123 45 67")).toBe("+905321234567");
    expect(normalizeTurkeyPhone("+90 (212) 555 00 00")).toBe("+902125550000");
    expect(normalizeTurkeyPhone("not-a-phone")).toBeNull();
  });

  it("builds iPhone-compatible call, SMS and WhatsApp actions", () => {
    expect(getContactLinks("0212 555 00 00", "0532 123 45 67")).toEqual({
      phone: "+902125550000",
      callHref: "tel:+902125550000",
      messageHref: "sms:+902125550000",
      whatsappHref: "https://wa.me/905321234567",
    });
  });
});
