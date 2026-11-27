import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db.ts";
import { createParcel } from "../parcels/parcel-repository.ts";
import { loginAs, startTestServer } from "../test-helper.ts";

let baseUrl: string;
let closeServer: () => void;
let cashier: string;
let driver: { userId: string; cookie: string };

const unknownId = "01a20fa1-d727-7b71-a40c-e88ac5d364dd";

beforeAll(async () => {
  const server = await startTestServer();
  baseUrl = server.baseUrl;
  closeServer = server.close;
});

beforeEach(async () => {
  await pool.query("TRUNCATE parcels, users CASCADE");
  cashier = (await loginAs("CASHIER")).cookie;
  driver = await loginAs("DRIVER");
});

afterAll(async () => {
  closeServer();
  await pool.end();
});

function call(method: string, path: string, cookie?: string, body?: unknown) {
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const tripBody = () => ({
  driverId: driver.userId,
  vehicleNumber: "gr-1234-22",
  destination: "Kumasi",
});

async function newTrip(): Promise<{ id: string }> {
  return (await call("POST", "/trips", cashier, tripBody())).json();
}

function newParcel() {
  return createParcel({
    senderName: "Ama Mensah",
    senderPhone: "+233241234567",
    receiverName: "Kojo Boateng",
    receiverPhone: "+233201234567",
    description: "Box of books",
  });
}

describe("access", () => {
  it("requires a login", async () => {
    expect((await call("GET", "/trips")).status).toBe(401);
  });

  it("keeps drivers out of the staff routes", async () => {
    expect((await call("GET", "/trips", driver.cookie)).status).toBe(403);
    expect((await call("POST", "/trips", driver.cookie, tripBody())).status).toBe(403);
    expect((await call("GET", "/drivers", driver.cookie)).status).toBe(403);
  });
});

describe("POST /trips", () => {
  it("creates a trip and tidies the vehicle number", async () => {
    const response = await call("POST", "/trips", cashier, tripBody());
    expect(response.status).toBe(201);

    const trip = await response.json();
    expect(trip.status).toBe("PLANNED");
    expect(trip.driverName).toBe("Test DRIVER");
    expect(trip.vehicleNumber).toBe("GR-1234-22");
  });

  it("returns 400 with a message for each missing field", async () => {
    const response = await call("POST", "/trips", cashier, {});
    expect(response.status).toBe(400);

    const fields = (await response.json()).details.map((detail: { field: string }) => detail.field);
    expect(fields).toEqual(expect.arrayContaining(["driverId", "vehicleNumber", "destination"]));
  });

  it("returns 400 when the chosen user is not a driver", async () => {
    const other = await loginAs("CASHIER");
    const response = await call("POST", "/trips", cashier, { ...tripBody(), driverId: other.userId });

    expect(response.status).toBe(400);
    expect((await response.json()).details[0].field).toBe("driverId");
  });
});

describe("GET /trips", () => {
  it("lists trips and can filter by status", async () => {
    const first = await newTrip();
    const second = await newTrip();
    await call("POST", `/trips/${first.id}/depart`, cashier);

    expect(await (await call("GET", "/trips", cashier)).json()).toHaveLength(2);

    const planned = await (await call("GET", "/trips?status=PLANNED", cashier)).json();
    expect(planned.map((trip: { id: string }) => trip.id)).toEqual([second.id]);

    expect((await call("GET", "/trips?status=BOGUS", cashier)).status).toBe(400);
  });

  it("shows a trip with its parcels", async () => {
    const trip = await newTrip();
    const parcel = await newParcel();
    await call("POST", `/trips/${trip.id}/parcels`, cashier, { parcelIds: [parcel.id] });

    const details = await (await call("GET", `/trips/${trip.id}`, cashier)).json();
    expect(details.parcels).toHaveLength(1);
    expect(details.parcels[0].trackingCode).toBe(parcel.trackingCode);
  });

  it("returns 404 for an unknown trip and for something that is not an id", async () => {
    expect((await call("GET", `/trips/${unknownId}`, cashier)).status).toBe(404);
    expect((await call("GET", "/trips/not-an-id", cashier)).status).toBe(404);
  });
});

describe("parcels on a trip", () => {
  it("adds parcels, and refuses a parcel that is already on another trip", async () => {
    const trip = await newTrip();
    const other = await newTrip();
    const parcel = await newParcel();

    const added = await call("POST", `/trips/${trip.id}/parcels`, cashier, { parcelIds: [parcel.id] });
    expect(added.status).toBe(200);
    expect((await added.json()).parcelCount).toBe(1);

    const again = await call("POST", `/trips/${other.id}/parcels`, cashier, { parcelIds: [parcel.id] });
    expect(again.status).toBe(409);
  });

  it("removes a parcel before departure, and says 404 the second time", async () => {
    const trip = await newTrip();
    const parcel = await newParcel();
    await call("POST", `/trips/${trip.id}/parcels`, cashier, { parcelIds: [parcel.id] });

    expect((await call("DELETE", `/trips/${trip.id}/parcels/${parcel.id}`, cashier)).status).toBe(204);
    expect((await call("DELETE", `/trips/${trip.id}/parcels/${parcel.id}`, cashier)).status).toBe(404);
  });
});

describe("departing and arriving", () => {
  it("lets staff depart a trip, which moves its parcels too", async () => {
    const trip = await newTrip();
    const parcel = await newParcel();
    await call("POST", `/trips/${trip.id}/parcels`, cashier, { parcelIds: [parcel.id] });

    const response = await call("POST", `/trips/${trip.id}/depart`, cashier);
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("DEPARTED");

    const details = await (await call("GET", `/trips/${trip.id}`, cashier)).json();
    expect(details.parcels[0].status).toBe("IN_TRANSIT");
  });

  it("lets a driver depart their own trip, once", async () => {
    const trip = await newTrip();

    expect((await call("POST", `/trips/${trip.id}/depart`, driver.cookie)).status).toBe(200);
    expect((await call("POST", `/trips/${trip.id}/depart`, driver.cookie)).status).toBe(409);
  });

  it("treats another driver's trip as not found", async () => {
    const trip = await newTrip();
    const otherDriver = await loginAs("DRIVER");

    expect((await call("POST", `/trips/${trip.id}/depart`, otherDriver.cookie)).status).toBe(404);
  });

  it("lets the driver arrive after departing", async () => {
    const trip = await newTrip();
    await call("POST", `/trips/${trip.id}/depart`, driver.cookie);

    const response = await call("POST", `/trips/${trip.id}/arrive`, driver.cookie);
    expect(response.status).toBe(200);
    expect((await response.json()).status).toBe("ARRIVED");
  });

  it("refuses to arrive before departing", async () => {
    const trip = await newTrip();
    expect((await call("POST", `/trips/${trip.id}/arrive`, driver.cookie)).status).toBe(409);
  });
});

describe("GET /trips/mine", () => {
  it("returns the driver's current trip, or null when there is none", async () => {
    expect(await (await call("GET", "/trips/mine", driver.cookie)).json()).toBeNull();

    const trip = await newTrip();
    expect((await (await call("GET", "/trips/mine", driver.cookie)).json()).id).toBe(trip.id);
  });

  it("is only for drivers", async () => {
    expect((await call("GET", "/trips/mine", cashier)).status).toBe(403);
  });
});

describe("GET /drivers", () => {
  it("lists active drivers for staff", async () => {
    const response = await call("GET", "/drivers", cashier);
    expect(response.status).toBe(200);

    const drivers = await response.json();
    expect(drivers.map((entry: { id: string }) => entry.id)).toEqual([driver.userId]);
  });
});