import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db.ts";
import { sessionCookieForTest, startTestServer } from "../test-helper.ts";

let closeServer: () => void;
let baseUrl: string;
let cookie: string;

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
  closeServer = server.close
});

beforeEach(async () => {
  await pool.query("TRUNCATE parcels");
  cookie = await sessionCookieForTest("CASHIER")
});

afterAll(async () => {
  closeServer()
  await pool.end();
});

const validParcel = {
  senderName: "Ama Mensah",
  senderPhone: "0241234567",
  receiverName: "Kojo Boateng",
  receiverPhone: "0201234567",
  description: "Box of books",
};

function post(body: unknown, cookieHeader: string | undefined = cookie) {
  return fetch(`${baseUrl}/parcels`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(cookieHeader ? {Cookie: cookieHeader}: {}) },
    body: JSON.stringify(body),
  });
}

function get(cookieHeader: string | undefined = cookie){
  return(fetch(`${baseUrl}/parcels`, cookieHeader ? {headers: {Cookie: cookieHeader}}: {}))
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
      headers: { "Content-Type": "application/json", Cookie: cookie},
      body: "{not json",
    });
    expect(response.status).toBe(400);
  });

  it("returns 400 when the body is missing", async () => {
    const response = await fetch(`${baseUrl}/parcels`, { method: "POST", headers: {Cookie: cookie}});
    expect(response.status).toBe(400);
  });
});

describe("GET /parcels", () => {
  it("returns an empty list when there are no parcels", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("lists parcels newest first", async () => {
    for (const name of ["First", "Second", "Third"]) {
      await post({ ...validParcel, receiverName: name });
    }

    const parcels = await (await (get())).json();
    expect(parcels.map((parcel: { receiverName: string }) => parcel.receiverName),).toEqual([
      "Third",
      "Second",
      "First",
    ]);
  });
});


describe("access control", () => {
  it("returns 401 when nobody is logged in", async () => {
    expect((await get("undefined")).status).toBe(401);
    expect((await post(validParcel, "undefined")).status).toBe(401);
  });

  it("returns 401 for a session token that does not exist", async () => {
    expect((await get("session=not-a-real-token")).status).toBe(401);
  });

  it("returns 403 for a role that may not use parcels", async () => {
    const driverCookie = await sessionCookieForTest("DRIVER");
    expect((await get(driverCookie)).status).toBe(403);
    expect((await post(validParcel, driverCookie)).status).toBe(403);
  });
});