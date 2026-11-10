import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../app.ts";
import { pool } from "../db.ts";

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });
  baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
});

beforeEach(async () => {
  await pool.query("TRUNCATE parcels");
});

afterAll(async () => {
  server.close();
  await pool.end();
});

const validParcel = {
  senderName: "Ama Mensah",
  senderPhone: "0241234567",
  receiverName: "Kojo Boateng",
  receiverPhone: "0201234567",
  description: "Box of books",
};

function post(body: unknown) {
  return fetch(`${baseUrl}/parcels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /parcels", () => {
  it("creates a parcel and returns 201", async () => {
    const response = await post(validParcel);
    expect(response.status).toBe(201);

    const parcel = await response.json();
    expect(parcel.trackingCode).toMatch(/^PT-[A-HJKMNP-Z2-9]{6}$/);
    expect(parcel.status).toBe("REGISTERED");
    expect(parcel.senderPhone).toBe("+233241234567");
  });

  it("returns 400 with a message for each invalid field", async () => {
    const response = await post({ ...validParcel, senderPhone: "123", description: "" });
    expect(response.status).toBe(400);

    const body = await response.json();
    const fields = body.details.map((detail: { field: string }) => detail.field);
    expect(fields).toContain("senderPhone");
    expect(fields).toContain("description");
  });

  it("returns 400 when the body is not valid JSON", async () => {
    const response = await fetch(`${baseUrl}/parcels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when the body is missing", async () => {
    const response = await fetch(`${baseUrl}/parcels`, { method: "POST" });
    expect(response.status).toBe(400);
  });
});

describe("GET /parcels", () => {
  it("returns an empty list when there are no parcels", async () => {
    const response = await fetch(`${baseUrl}/parcels`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("lists parcels newest first", async () => {
    for (const name of ["First", "Second", "Third"]) {
      await post({ ...validParcel, receiverName: name });
    }

    const parcels = await (await fetch(`${baseUrl}/parcels`)).json();
    expect(parcels.map((parcel: { receiverName: string }) => parcel.receiverName)).toEqual([
      "Third",
      "Second",
      "First",
    ]);
  });
});