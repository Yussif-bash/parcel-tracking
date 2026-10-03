import { describe, expect, it } from "vitest";
import {
  createParcelInputSchema,
  locationBatchSchema,
  NOTIFY_AHEAD,
  phoneSchema,
} from "./index.js";

const baseParcel = {
  senderName: "Ama Mensah",
  senderPhone: "+233241234567",
  receiverName: "Kojo Boateng",
  receiverPhone: "+233201234567",
  description: "Box of books",
  routeId: "route-accra-kumasi",
};

describe("phoneSchema", () => {
  it("accepts international format", () => {
    expect(phoneSchema.safeParse("+233241234567").success).toBe(true);
  });
  it("rejects local format", () => {
    expect(phoneSchema.safeParse("0241234567").success).toBe(false);
  });
});

describe("createParcelInputSchema", () => {
  it("defaults the alert lead time to 30 minutes", () => {
    const parsed = createParcelInputSchema.parse(baseParcel);
    expect(parsed.notifyAheadMinutes).toBe(NOTIFY_AHEAD.DEFAULT_MINUTES);
  });
  it("accepts a customer-chosen lead time", () => {
    const parsed = createParcelInputSchema.parse({ ...baseParcel, notifyAheadMinutes: 45 });
    expect(parsed.notifyAheadMinutes).toBe(45);
  });
  it("rejects a lead time outside the allowed range", () => {
    expect(
      createParcelInputSchema.safeParse({ ...baseParcel, notifyAheadMinutes: 1 }).success,
    ).toBe(false);
    expect(
      createParcelInputSchema.safeParse({ ...baseParcel, notifyAheadMinutes: 500 }).success,
    ).toBe(false);
  });
});

describe("locationBatchSchema", () => {
  it("accepts a batch of points with their own timestamps", () => {
    const result = locationBatchSchema.safeParse({
      batchId: "batch-0001",
      points: [{ lat: 6.6885, lng: -1.6244, recordedAt: "2026-10-02T08:00:00Z" }],
    });
    expect(result.success).toBe(true);
  });
  it("rejects an empty batch", () => {
    expect(locationBatchSchema.safeParse({ batchId: "batch-0001", points: [] }).success).toBe(
      false,
    );
  });
});
