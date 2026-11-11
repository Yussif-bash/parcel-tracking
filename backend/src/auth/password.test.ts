import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password.ts";

describe("password hashing", () => {
    it("accepts the correct password", async () => {
        const stored = await hashPassword("correct horse battery staple");
        expect(await verifyPassword("correct horse battery staple", stored)).toBe(true)
    });

    it("rejects wrong password", async() => {
        const stored = await hashPassword("correct horse battery staple");
        expect(await verifyPassword("wrong password", stored)).toBe(false)
    });

    it("never stores the password itself", async() => {
        const stored = await hashPassword("correct horse battery staple");
        expect(stored).not.toContain("correct horse")
    });

    it("gives the same password different hash", async() => {
        const first = await hashPassword("same password");
        const second = await hashPassword("same password");
        expect(first).not.toBe(second)
    });

    it("records the settings used, so they can change later", async() => {
        const stored = await hashPassword("anything");
        expect(stored.startsWith("argon2id$m=19456,t=2,p=1$")).toBe(true)
    });

    it("returns false for malformed stored values instead of crashing", async () => {
        for (const broken of ["", "garbage", "argon2id$m=1,t=1,p=1$x$y"]) {
        expect(await verifyPassword("anything", broken)).toBe(false);
        }
  });
})