import { describe, expect, it } from "vitest";
import { nameSchema } from "./name.ts";

describe("nameSchema", () => {
  it("trims spaces", () => {
    expect(nameSchema.parse("  Ama Mensah  ")).toBe("Ama Mensah");
  });

  it("rejects empty and blank names", () => {
    expect(nameSchema.safeParse("").success).toBe(false);
    expect(nameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects names over 120 characters", () => {
    expect(nameSchema.safeParse("x".repeat(121)).success).toBe(false);
  });

  it("gives a friendly message when the name is missing", () => {
    const result = nameSchema.safeParse(undefined);
    expect(result.error?.issues[0]?.message).toBe("Name is required");
  });
});