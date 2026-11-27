import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { pool } from "../db.ts";
import { createParcel } from "../parcels/parcel-repository.ts";
import { createUser } from "../users/user-repository.ts";
import { 
    DriverNotFoundError,
    ParcelsNotAvailableError,
    TripNotFondError,
    TripStateError,
    assignParcels,
    createTrip,
    departTrip,
    arriveTrip,
    findCurrentTripForDriver,
    getTripDetails,
    listTrips,
    unassignParcel
 } from "./trip-repository.ts";


 let driverId: string;

 const unknwonId = "01a20fa1-d727-7b71-a40c-e88ac5d364dd";

 const parcelInput = {
    senderName: "Ama Mensah",
    senderPhone: "+233241234567",
    receiverName: "Kojo Boateng",
    receiverPhone: "+233201234567",
    description: "Box of books"
 }

 const tripInput = () => ({driverId, vehicleNumber: "GR-1234-22", destination: "Accra"});

 async function parcelStatus(id: string) {
    const result = await pool.query<{status: string}>(
        "SELECT status FROM parcels WHERE id = $1", [id]
    );

    return result.rows[0]!.status;
 }

 
 beforeEach(async () => {
    await pool.query("TRUNCATE parcels, users CASCADE");
    const driver = await createUser({
        name: "Kwame Driver",
        phone: "+233200000001",
        role: "DRIVER",
    }, "hash-value");

    driverId = driver.id
 });

 afterAll(async () => {
    await pool.end();
 });

 describe("createTrip", () => {
    it("creates a plannend trip with the driver's name and no parcels", async () => {
        const trip = await createTrip(tripInput());
        expect(trip.status).toBe("PLANNED");
        expect(trip.driverName).toBe("Kwame Driver");
        expect(trip.vehicleNumber).toBe("GR-1234-22");
        expect(trip.parcelCount).toBe(0);
        expect(trip.departedAt).toBeNull();
    });

    it("refuses an unknown driver, a user who is not a driver, and a switched-off driver", async() => {
        const cashier = await createUser({
            name: "Ama",
            phone: "+233200000002",
            role: "CASHIER"
        }, "hash-value");

        await expect(createTrip({...tripInput(), driverId: cashier.id})).rejects.toThrow(DriverNotFoundError);
        await expect(createTrip({...tripInput(), driverId: unknwonId})).rejects.toThrow(DriverNotFoundError);

        await pool.query("UPDATE users set active = false WHERE id = $1", [driverId]);
        await expect(createTrip(tripInput())).rejects.toThrow(DriverNotFoundError)
    });
 });


 describe("assignParcels", () => {
    it("adds parcels to a planned trip", async() =>{
        const trip = await createTrip(tripInput());
        const first = await createParcel(parcelInput);
        const second = await createParcel(parcelInput);

        await assignParcels(trip.id, [first.id, second.id]);

        const details = await getTripDetails(trip.id);
        expect(details?.parcelCount).toBe(2);
        expect(details?.parcels.map((parcel) => parcel.id).sort()).toEqual([first.id, second.id].sort());
        expect(details?.parcels[0]?.tripId).toBe(trip.id);
    });

    it("does nothing after departure or for a parcel that is not on the trip", async () =>{
        const trip = await createTrip(tripInput());
        const parcel = await createParcel(parcelInput);
        const stranger = await createParcel(parcelInput);
        await assignParcels(trip.id, [parcel.id]);

        expect (await unassignParcel(trip.id, stranger.id)).toBe(false);

        await departTrip(trip.id);
        expect( await unassignParcel(trip.id, parcel.id)).toBe(false);
        expect( (await getTripDetails(trip.id))?.parcelCount).toBe(1);
    });
 });


 describe("departTrip and arriveTrip", () => {
    it("departing moves the trip and its parcels together", async() =>{
        const trip = await createTrip(tripInput());
        const parcel = await createParcel(parcelInput);
        const waiting = await createParcel(parcelInput);
        await assignParcels(trip.id, [parcel.id]);

        await departTrip(trip.id);

        const details = await getTripDetails(trip.id);
        expect(details?.status).toBe("DEPARTED");
        expect(details?.departedAt).toBeInstanceOf(Date);
        expect(await parcelStatus(parcel.id)).toBe("IN_TRANSIT");
        expect(await parcelStatus(waiting.id)).toBe("REGISTERED")
    });


    it("ariving moves the trip and its parcels together", async () =>{
        const trip = await createTrip(tripInput());
        const parcel = await createParcel(parcelInput);
        await assignParcels(trip.id, [parcel.id]);

        await departTrip(trip.id);

        await arriveTrip(trip.id);

        const details = await getTripDetails(trip.id);
        expect(details?.status).toBe("ARRIVED");
        expect(details?.arrivedAt).toBeInstanceOf(Date);
        expect(await parcelStatus(parcel.id)).toBe("ARRIVED");

    });

    it("cannot depart twice or arrive before departing", async() => {
        const trip = await createTrip(tripInput());

        await expect(arriveTrip(trip.id)).rejects.toThrow(TripStateError);

        await departTrip(trip.id);
        await expect(departTrip(trip.id)).rejects.toThrow(TripStateError);
    });

    it("reports an unknown trip as not found", async() => {
        await expect(departTrip(unknwonId)).rejects.toThrow(TripNotFondError);
        await expect(arriveTrip(unknwonId)).rejects.toThrow(TripNotFondError);
    });

    it("two departure at the same moment: exactly one wins", async () => {
        const trip = await createTrip(tripInput());
        const results = await Promise.allSettled([departTrip(trip.id), departTrip(trip.id)]);
        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    });
 });

 describe("listTrips aand findCurrentTripForDriver", () => {
    it("list newest first and can filter by status", async() => {
        const first = await createTrip({...tripInput(), destination: "Accra"});
        const second = await createTrip({...tripInput(), destination: "Tamale"});

        await departTrip(first.id);

        expect((await listTrips()).map((trip) => trip.destination)).toEqual(["Tamale", "Accra"]);
        expect((await listTrips(["PLANNED"])).map((trip) => trip.id)).toEqual([second.id]);
        expect((await listTrips(["DEPARTED", "PLANNED"])).length).toBe(2)
    });

    it("finds the driver's current trip and nothing once it has arrived", async() => {
        expect(await findCurrentTripForDriver(driverId)).toBeNull();

        const trip = await createTrip(tripInput());
        expect((await findCurrentTripForDriver(driverId))?.id).toBe(trip.id);

        await departTrip(trip.id);
        await arriveTrip(trip.id);
        expect(await findCurrentTripForDriver(driverId)).toBeNull();
    });
 });
