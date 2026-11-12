import { describe, expect, it } from "vitest";
import { phoneSchema } from "./phone.ts";

describe("phoneSchema", () => {
  it("converts a local Ghana number to international format", () => {
    expect(phoneSchema.parse("0241234567")).toBe("+233241234567");
  });

  it("removes spaces and dashes", () => {
    expect(phoneSchema.parse("+233 24 123-4567")).toBe("+233241234567");
  });

  it("accepts an international number as it is", () => {
    expect(phoneSchema.parse("+233201234567")).toBe("+233201234567");
  });

  it("rejects invalid numbers", () => {
    for (const phone of ["12345", "abc", "0241234", "+0123456789"]) {
      expect(phoneSchema.safeParse(phone).success).toBe(false);
    }
  });

  it("gives a friendly message when the number is missing", () => {
    const result = phoneSchema.safeParse(undefined);
    expect(result.error?.issues[0]?.message).toBe("Phone number is required");
  });
});