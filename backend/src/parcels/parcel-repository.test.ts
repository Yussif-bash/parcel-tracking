import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { pool } from "../db.ts";
import { createParcel } from "./parcel-repository.ts";
import { generateTrackingCode } from "./tracking-code.ts";

// Wrap the real generator so one test can force a repeated code.
vi.mock("./tracking-code.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./tracking-code.ts")>();
  return { generateTrackingCode: vi.fn(actual.generateTrackingCode) };
});

const input = {
  senderName: "Ama Mensah",
  senderPhone: "+233241234567",
  receiverName: "Kojo Boateng",
  receiverPhone: "+233201234567",
  description: "Box of books",
};

beforeEach(async () => {
  await pool.query("TRUNCATE parcels");
});

afterAll(async () => {
  await pool.end();
});

describe("createParcel", () => {
  it("saves a parcel with a tracking code and the default status", async () => {
    const parcel = await createParcel(input);

    expect(parcel.trackingCode).toMatch(/^PT-[A-HJKMNP-Z2-9]{6}$/);
    expect(parcel.status).toBe("REGISTERED");
    expect(parcel.receiverName).toBe("Kojo Boateng");

    const count = await pool.query<{ n: number }>("SELECT count(*)::int AS n FROM parcels");
    expect(count.rows[0]!.n).toBe(1);
  });

  it("gives every parcel a different tracking code", async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add((await createParcel(input)).trackingCode);
    }
    expect(codes.size).toBe(20);
  });

  it("tries again when a tracking code is already taken", async () => {
    vi.mocked(generateTrackingCode)
      .mockReturnValueOnce("PT-AAAAAA")
      .mockReturnValueOnce("PT-AAAAAA");

    const first = await createParcel(input);
    const second = await createParcel(input);

    expect(first.trackingCode).toBe("PT-AAAAAA");
    expect(second.trackingCode).not.toBe("PT-AAAAAA");
  });

  it("stores special characters as plain text", async () => {
    const parcel = await createParcel({ ...input, description: "Robert'); DROP TABLE parcels;--" });
    expect(parcel.description).toBe("Robert'); DROP TABLE parcels;--");
  });
});