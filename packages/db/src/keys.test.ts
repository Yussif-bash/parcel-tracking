import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it } from "vitest";
import { createDb } from "./db.js";
import { generateTrackingCode, hashToken } from "./codes.js";

// .params() builds the request ElectroDB would send, without calling AWS.
const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "eu-west-1" }));
const db = createDb({ tableName: "test-table", client });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const item = (params: any) => params.Item as Record<string, unknown>;

describe("trip keys", () => {
  const params = db.trip
    .create({ tripId: "01TRIP", driverId: "01DRV", routeId: "R1", vehicleLabel: "GR-1234" })
    .params();

  it("uses TRIP#id / META and keeps the case", () => {
    expect(item(params).pk).toBe("TRIP#01TRIP");
    expect(item(params).sk).toBe("META");
  });
  it("is listed by status on gsi1 and by driver on gsi2", () => {
    expect(item(params).gsi1pk).toBe("TRIPSTATUS#PLANNED");
    expect(item(params).gsi1sk).toBe("01TRIP");
    expect(item(params).gsi2pk).toBe("DRIVER#01DRV");
    expect(item(params).gsi2sk).toBe("01TRIP");
  });
  it("fills in defaults and timestamps", () => {
    expect(item(params).status).toBe("PLANNED");
    expect(item(params).trackingMode).toBe("LIVE");
    expect(typeof item(params).createdAt).toBe("string");
    expect(typeof item(params).updatedAt).toBe("string");
  });
});

describe("queries", () => {
  it("lists active trips through gsi1", () => {
    const params = db.trip.query.byStatus({ status: "ACTIVE" }).params() as Record<string, unknown>;
    expect(params.IndexName).toBe("gsi1");
    expect(JSON.stringify(params)).toContain("TRIPSTATUS#ACTIVE");
  });
  it("lists a driver's trips through gsi2", () => {
    const params = db.trip.query.byDriver({ driverId: "01DRV" }).params() as Record<
      string,
      unknown
    >;
    expect(params.IndexName).toBe("gsi2");
    expect(JSON.stringify(params)).toContain("DRIVER#01DRV");
  });
  it("finds a parcel by tracking code through gsi1", () => {
    const params = db.parcel.query.byTrackingCode({ trackingCode: "PT-ABC234" }).params() as Record<
      string,
      unknown
    >;
    expect(params.IndexName).toBe("gsi1");
    expect(JSON.stringify(params)).toContain("CODE#PT-ABC234");
  });
  it("finds a parcel by token hash through gsi2", () => {
    const params = db.parcel.query.byToken({ tokenHash: hashToken("secret") }).params() as Record<
      string,
      unknown
    >;
    expect(params.IndexName).toBe("gsi2");
    expect(JSON.stringify(params)).toContain(`TOKEN#${hashToken("secret")}`);
  });
  it("lists all parcels on a trip from the trip partition", () => {
    const params = db.tripParcel.query.tripParcel({ tripId: "01TRIP" }).params() as Record<
      string,
      unknown
    >;
    expect(params.IndexName).toBeUndefined();
    expect(JSON.stringify(params)).toContain("TRIP#01TRIP");
  });
  it("lists all routes and drivers through gsi1", () => {
    const routes = db.route.query.all({}).params() as Record<string, unknown>;
    const drivers = db.driver.query.all({}).params() as Record<string, unknown>;
    expect(routes.IndexName).toBe("gsi1");
    expect(JSON.stringify(routes)).toContain("ROUTE");
    expect(drivers.IndexName).toBe("gsi1");
    expect(JSON.stringify(drivers)).toContain("DRIVER");
  });
});

describe("parcel keys", () => {
  const code = generateTrackingCode();
  const params = db.parcel
    .create({
      parcelId: "01PARCEL",
      trackingCode: code,
      senderName: "Ama",
      senderPhone: "+233241234567",
      receiverName: "Kojo",
      receiverPhone: "+233201234567",
      description: "Box",
      routeId: "R1",
      tokenHash: hashToken("secret"),
    })
    .params();

  it("has the parcel keys and the lookup keys", () => {
    expect(item(params).pk).toBe("PARCEL#01PARCEL");
    expect(item(params).sk).toBe("META");
    expect(item(params).gsi1pk).toBe(`CODE#${code}`);
    expect(item(params).gsi2pk).toBe(`TOKEN#${hashToken("secret")}`);
  });
  it("defaults the alert time to 30 minutes and the status to REGISTERED", () => {
    expect(item(params).notifyAheadMinutes).toBe(30);
    expect(item(params).status).toBe("REGISTERED");
  });
});

describe("trip parcel, location point and notification keys", () => {
  it("puts a parcel under its trip", () => {
    const params = db.tripParcel
      .create({
        tripId: "01TRIP",
        parcelId: "01PARCEL",
        receiverName: "Kojo",
        receiverPhone: "+233201234567",
      })
      .params();
    expect(item(params).pk).toBe("TRIP#01TRIP");
    expect(item(params).sk).toBe("PARCEL#01PARCEL");
    expect(item(params).notifyAheadMinutes).toBe(30);
  });

  it("stores a location point with a time-sortable sort key and a TTL", () => {
    const params = db.locationPoint
      .create({
        tripId: "01TRIP",
        recordedAt: "2026-10-05T08:00:00.000Z",
        lat: 6.6885,
        lng: -1.6244,
        batchId: "batch-0001",
        expiresAt: 1790000000,
      })
      .params();
    expect(item(params).pk).toBe("TRIP#01TRIP");
    expect(item(params).sk).toBe("LOC#2026-10-05T08:00:00.000Z");
    expect(item(params).expiresAt).toBe(1790000000);
  });

  it("creates a notification record that can only be written once", () => {
    const params = db.notification
      .create({ parcelId: "01PARCEL", event: "TRIP_STARTED" })
      .params() as Record<string, unknown>;
    expect(item(params).pk).toBe("NOTIF#01PARCEL#TRIP_STARTED");
    expect(item(params).sk).toBe("SENT");
    expect(JSON.stringify(params)).toContain("attribute_not_exists");
  });
});
