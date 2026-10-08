import { describe, expect, it } from "vitest";
import { generateTrackingCode, generateTrackingToken, hashToken } from "./codes.js";
import { newId } from "./ids.js";
import { LOCATION_RETENTION_DAYS, ttlEpochSeconds } from "./time.js";

describe("newId", () => {
  it("is 26 characters from the Crockford alphabet", () => {
    expect(newId()).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });
  it("sorts by creation time", () => {
    const earlier = newId(Date.parse("2026-10-05T08:00:00Z"));
    const later = newId(Date.parse("2026-10-05T08:00:01Z"));
    expect([later, earlier].sort()).toEqual([earlier, later]);
  });
  it("is unique even within the same millisecond", () => {
    const ids = new Set(Array.from({ length: 5000 }, () => newId(1_790_000_000_000)));
    expect(ids.size).toBe(5000);
  });
});

describe("generateTrackingCode", () => {
  it("looks like PT- plus six readable characters", () => {
    for (let i = 0; i < 200; i++) expect(generateTrackingCode()).toMatch(/^PT-[A-HJKMNP-Z2-9]{6}$/);
  });
  it("never uses confusing characters", () => {
    const all = Array.from({ length: 500 }, generateTrackingCode).join("");
    expect(all.replace(/PT-/g, "")).not.toMatch(/[01OIL]/);
  });
});

describe("tracking token", () => {
  it("has at least 128 bits of randomness (32 bytes here) and is URL safe", () => {
    const { token } = generateTrackingToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it("stores only a hash that matches the token", () => {
    const { token, tokenHash } = generateTrackingToken();
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(token)).toBe(tokenHash);
    expect(tokenHash).not.toContain(token);
  });
  it("makes a different token every time", () => {
    expect(generateTrackingToken().token).not.toBe(generateTrackingToken().token);
  });
});

describe("ttlEpochSeconds", () => {
  it("returns whole seconds in the future", () => {
    const now = Date.parse("2026-10-05T00:00:00Z");
    expect(ttlEpochSeconds(30, now)).toBe(now / 1000 + 30 * 86400);
  });
  it("defaults retention to 30 days", () => {
    expect(LOCATION_RETENTION_DAYS).toBe(30);
  });
});
