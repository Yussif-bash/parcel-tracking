import { describe,  it, expect} from "vitest";
import { generateTrackingCode } from "./tracking-code.ts";

describe("generateTrackingCode", () => {
    it("looks like PT- plus six readable characters", () => {
         for (let i = 0; i < 200; i++) {
            expect(generateTrackingCode()).toMatch(/^PT-[A-HJKMNP-Z2-9]{6}$/);
            }
    });

    it("never uses confusing characters", () => {
        const all = Array.from({ length: 500 }, generateTrackingCode).join("");
        expect(all.replace(/PT-/g, "")).not.toMatch(/[01OIL]/);
  });
})