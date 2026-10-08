import { ConditionalCheckFailedException, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "./db.js";
import { confirmReceipt, recordNotificationOnce, updateLatestPosition } from "./operations.js";

const mock = mockClient(DynamoDBDocumentClient);
const db = createDb({
  tableName: "test-table",
  client: DynamoDBDocumentClient.from(new DynamoDBClient({ region: "eu-west-1" })),
});

const conditionFailed = () =>
  new ConditionalCheckFailedException({ message: "The conditional request failed", $metadata: {} });

beforeEach(() => mock.reset());

describe("recordNotificationOnce", () => {
  it("returns true the first time", async () => {
    mock.on(PutCommand).resolves({});
    expect(await recordNotificationOnce(db, { parcelId: "P1", event: "TRIP_STARTED" })).toBe(true);
    const input = mock.commandCalls(PutCommand)[0]!.args[0].input;
    expect(input.ConditionExpression).toContain("attribute_not_exists");
  });

  it("returns false when the notification was already recorded", async () => {
    mock.on(PutCommand).rejects(conditionFailed());
    expect(await recordNotificationOnce(db, { parcelId: "P1", event: "TRIP_STARTED" })).toBe(false);
  });

  it("does not hide other errors", async () => {
    mock.on(PutCommand).rejects(new Error("network down"));
    await expect(
      recordNotificationOnce(db, { parcelId: "P1", event: "TRIP_STARTED" }),
    ).rejects.toThrow();
  });
});

describe("updateLatestPosition", () => {
  const point = { tripId: "T1", lat: 6.7, lng: -1.6, recordedAt: "2026-10-05T08:00:00.000Z" };

  it("only updates when the point is newer than the stored one", async () => {
    mock.on(UpdateCommand).resolves({});
    expect(await updateLatestPosition(db, point)).toBe(true);
    const input = mock.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(input.Key).toEqual({ pk: "TRIP#T1", sk: "META" });
    expect(input.ConditionExpression).toContain("attribute_not_exists");
    expect(input.ConditionExpression).toContain("<");
  });

  it("returns false for a late or duplicate point instead of moving the map backwards", async () => {
    mock.on(UpdateCommand).rejects(conditionFailed());
    expect(await updateLatestPosition(db, point)).toBe(false);
  });
});

describe("confirmReceipt", () => {
  it("confirms a parcel the first time", async () => {
    mock.on(UpdateCommand).resolves({});
    expect(await confirmReceipt(db, { parcelId: "P1", source: "CUSTOMER" })).toBe(true);
    const input = mock.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(input.Key).toEqual({ pk: "PARCEL#P1", sk: "META" });
    expect(input.ConditionExpression).toContain("attribute_not_exists");
  });

  it("records the driver's position when the driver confirms", async () => {
    mock.on(UpdateCommand).resolves({});
    await confirmReceipt(db, {
      parcelId: "P1",
      source: "DRIVER",
      position: { lat: 6.7, lng: -1.6, recordedAt: "2026-10-05T08:00:00.000Z" },
    });
    const input = mock.commandCalls(UpdateCommand)[0]!.args[0].input;
    expect(JSON.stringify(input.ExpressionAttributeValues)).toContain("DRIVER");
    expect(JSON.stringify(input.ExpressionAttributeValues)).toContain("6.7");
  });

  it("first confirmation wins: a second one returns false", async () => {
    mock.on(UpdateCommand).rejects(conditionFailed());
    expect(await confirmReceipt(db, { parcelId: "P1", source: "DRIVER" })).toBe(false);
  });
});
