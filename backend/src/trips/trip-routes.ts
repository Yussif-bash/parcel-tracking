import { Router, type Response } from "express";
import { z } from "zod";
import { requireRole } from "../auth/auth-middleware.ts";
import { sendValidationError } from "../validation/send-validation-error.ts";
import {
     DriverNotFoundError,
     ParcelsNotAvailableError,
     TripNotFondError,
     TripStateError,
     arriveTrip,
     assignParcels,
     createTrip,
     departTrip,
     findCurrentTripForDriver,
     findTrip,
     getTripDetails,
     listTrips,
     unassignParcel
    } from "./trip-repository.ts";

    import { assignParcelsSchema, createTripSchema } from "./trip-schema.ts";

    export const tripRoutes = Router();

    const staff = requireRole("OWNER", "ADMIN", "CASHIER");
    const anyRole = requireRole("ADMIN", "CASHIER", "DRIVER", "OWNER");

    const statusFilterSchema = z.array(z.enum(["PLANNED", "DEPARTED", "ARRIVED", "CANCELLED"]));

    /** A trip id from the address, or null when it is not even a valid id. */
    function idFrom(value: unknown): string | null{
        const result = z.uuid().safeParse(value);
        return result.success ? result.data : null;
    }

    /** Turns the expected trip errors into replies. Returns false for errors it does not know. */
    function sendKnownTripError(error: unknown, res: Response): boolean {
        if(error instanceof TripNotFondError) {
            res.status(404).json({error: error.message});
            return true
        }
        if(error instanceof TripStateError || error instanceof ParcelsNotAvailableError) {
            res.status(409).json({error: error.message});
            return true
        }
        return false;
    }

    tripRoutes.get("/", staff, async (req, res) => {
        const raw = req.query.status;
        let statuses;

        if(typeof raw === "string"){
            const parsed = statusFilterSchema.safeParse(raw.split(","));
            if(!parsed.success){
                res.status(400).json({error: "unkown status filter"});
                return;
            }
            statuses = parsed.data;
        }
        res.json(await listTrips(statuses))
    });

    tripRoutes.post("/", staff, async(req, res) => {
        const result = createTripSchema.safeParse(req.body);

        if(!result.success){
            sendValidationError(res, result.error, "Invalid trip");
            return;
        }

        try {
            res.status(201).json(await createTrip(result.data));
        } catch (error) {
            if(error instanceof DriverNotFoundError){
                res.status(400).json({
                    error: "Invalid trip",
                    details: [
                        {
                            field: "driverId",
                            message: "Choose an active driver"
                        }
                    ]
                });
                return;
            }
            throw error;
        }
    });

    // A driver's own current trip. Declared before "/:id" so "mine" is not read as an id.
    tripRoutes.get("/mine", requireRole("DRIVER"), async(req, res) => {
        res.json(await findCurrentTripForDriver(req.user!.id));
    });

    tripRoutes.get("/:id", staff, async(req, res) => {
        const id = idFrom(req.params.id);
        const trip = id ? await getTripDetails(id) : null;

        if(!trip){
            res.status(404).json({error: "Trip not found"});
            return;
        }
       res.json(trip)
    });

    tripRoutes.post("/:id/parcels", staff, async(req, res) => {
        const id = idFrom(req.params.id);
        if(!id){
            res.status(404).json({error: "Trip not found"});
            return;
        }

        const result = assignParcelsSchema.safeParse(req.body);
        if(!result.success){
            sendValidationError(res, result.error, "Invalid parcels");
            return;
        }

        try {
            await assignParcels(id, result.data.parcelIds);
            res.json(await getTripDetails(id));
        } catch (error) {
            if(!sendKnownTripError(error, res)) throw error;
        }
    });

    tripRoutes.delete("/:id/parcels/:parcelId", staff, async(req, res) => {
        const id = idFrom(req.params.id);
        const parcelId = idFrom(req.params.parcelId);

        const removed = id && parcelId ? await unassignParcel(id, parcelId) : false;
        if(!removed){
            res.status(404).json({error: "That parcel is not on this trip or the trip has left"});
            return;
        }
        res.status(204).end();
    });

    // Staff or the trip's own driver
    async function moveTrip(
        req: Parameters<Parameters<typeof tripRoutes.post>[1]>[0],
        res: Response,
        action: (id: string) => Promise<void>
    ) {
        const id = idFrom(req.params.id);
        const trip = id ? await findTrip(id) : null;
        const user = req.user!;

        if(!id || !trip || (user.role === "DRIVER" && trip.driverId !== user.id)){
            res.status(404).json({error: "Trip not found"});
            return;
        }   
        

        try {
            await action(id);
            res.json(await findTrip(id));
        } catch (error) {
            if(!sendKnownTripError(error, res)) throw error;
        }
    }

    tripRoutes.post("/:id/depart", anyRole, (req, res) => moveTrip(req, res, departTrip));

    tripRoutes.post("/:id/arrive", anyRole, (req, res) => moveTrip(req, res, arriveTrip));