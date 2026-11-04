import { describe, expect, it } from "vitest";
import { createParcelSchema } from "./parcel-schema.ts";

const valid = {
  senderName: "Ama Mensah",
  senderPhone: "0241234567",
  receiverName: "Kojo Boateng",
  receiverPhone: "+233201234567",
  description: "Box of books",
};

describe("createParcelSchema", () => {
  it("accepts a valid parcel and trims text", () => {
    const parcel = createParcelSchema.parse({ ...valid, senderName: "  Ama Mensah  " });
    expect(parcel.senderName).toBe("Ama Mensah");
  });

  it("converts a local Ghana number to international format", () => {
    expect(createParcelSchema.parse(valid).senderPhone).toBe("+233241234567");
  });

  it("removes spaces from an international number", () => {
    const parcel = createParcelSchema.parse({ ...valid, receiverPhone: "+233 20 123 4567" });
    expect(parcel.receiverPhone).toBe("+233201234567");
  });

  it("rejects invalid phone numbers", () => {
    for (const phone of ["12345", "abc", "0241234", "+0123456789"]) {
      expect(createParcelSchema.safeParse({ ...valid, senderPhone: phone }).success).toBe(false);
    }
  });

  it("rejects empty names and descriptions", () => {
    expect(createParcelSchema.safeParse({ ...valid, senderName: "   " }).success).toBe(false);
    expect(createParcelSchema.safeParse({ ...valid, description: "" }).success).toBe(false);
  });

  it("rejects a description over 300 characters", () => {
    const tooLong = { ...valid, description: "x".repeat(301) };
    expect(createParcelSchema.safeParse(tooLong).success).toBe(false);
  });
});