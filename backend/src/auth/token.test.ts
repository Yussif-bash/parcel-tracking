import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "./token.ts";

describe("tokens", () => {
    it("makes a long URL-safe token", async() => {
        expect(generateToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    });

    it("makes different token everytime", async() => {
        expect(generateToken()).not.toBe(generateToken())
    });

    it("hashes the same token to the same value and never contains the token", async() => {
        const token = generateToken();

        expect(hashToken(token)).toBe(hashToken(token));
        expect(hashToken(token)).toMatch(/^[0-9a-f]{64}$/);
        expect(hashToken(token)).not.toContain(token)
    })
})