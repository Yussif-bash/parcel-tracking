import { describe, expect, it } from "vitest";
import { assignParcelsSchema, createTripSchema} from "./trip-schema.ts";

const someId = "01a20fa1-d727-7b71-a40c-e88ac5d364dd";


describe("createTripSchema", () => {
    it("accepts a valid trip and tidies the vehicle number", () => {
        const trip = createTripSchema.parse({
            driverId: someId,
            vehicleNumber: " gr-1234-22 ",
            destination: " Accra ",
        });

        expect(trip.vehicleNumber).toBe("GR-1234-22");
        expect(trip.destination).toBe("Accra")
    });

    it("rejects a driver that is not a valid id", () => {
        const result = createTripSchema.safeParse({
            driverId: "not-an-id",
            vehicleNumber: "GR-1",
            destination: "Kumasi"
        });

        expect(result.success).toBe(false);
    });

    it("gives a friendly message when fields are missing", () => {
        const result = createTripSchema.safeParse({});
        const messages = result.error?.issues.map((issue) => issue.message);

        expect(messages).toContain("Choose a driver");
        expect(messages).toContain("Vehicle number is required");
        expect(messages).toContain("Destination is required")
    });
});



describe("assignParcelsSchema", () => {
    it("accepts a list of parcel ids", () => {
        expect(assignParcelsSchema.safeParse({parcelIds: [someId]}).success).toBe(true)
    });

    it("rejects an empty list and a missing list", () =>{
        expect(assignParcelsSchema.safeParse({parcelIds: []}).success).toBe(false);
        expect(assignParcelsSchema.safeParse({}).success).toBe(false);
    });

    it("rejects more than 50 parcels", () => {
        const parcelIds = Array.from({length: 51}, () => someId);
        expect(assignParcelsSchema.safeParse({parcelIds}).success).toBe(false)
    })
})