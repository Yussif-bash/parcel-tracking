import { z } from "zod";


export const createTripSchema = z.object({
    driverId: z.uuid({error: "Choose a driver"}),
    vehicleNumber: z
    .string({error: "Vehicle number is required"})
    .trim()
    .min(1, "Vehicle number is required")
    .max(20, "Vehicle number is too long")
    .transform((value) => value.toLocaleUpperCase()),
    destination: z
    .string({error: "Destination is required"})
    .trim()
    .min(1, "Destination is required")
    .max(120, "Destination is too long")
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

export const assignParcelsSchema = z.object({
    parcelIds: z
    .array(z.uuid({error: "Invalid parcel"}), {error: "Choose at least one parcel"})
    .min(1, "Choose at least one parcel")
    .max(50, "A trip can take at most 50 parcels at a time")
});

export type AssignParcelInput = z.infer<typeof assignParcelsSchema>;