import { pool } from "../db.ts";
import { toParcel, type Parcel, type ParcelRow } from "../parcels/parcel-repository.ts";
import type { CreateTripInput } from "./trip-schema.ts";

export type TripStatus = "PLANNED" | "DEPARTED" | "ARRIVED" | "CANCELLED";

export interface Trip {
    id: string;
    driverId: string;
    driverName: string;
    vahicleNumaber: string;
    destination: string;
    status: TripStatus;
    departedAt: Date | null;
    arrivedAt: Date | null;
    createdAt: Date;
    parcelCount: number;
}

export interface TripDetails extends Trip {
    parcels: Parcel[];
}

interface TripRow {
    id: string;
    driver_id: string;
    driver_name: string;
    vehicle_number: string;
    destination: string;
    status: TripStatus;
    departed_at: Date | null;
    arrived_at: Date | null;
    created_at: Date;
    parcel_count: number;
}

function toTrip(row: TripRow): Trip {
    return {
        id: row.id,
        driverId: row.driver_id,
        driverName: row.driver_name,
        vahicleNumaber: row.vehicle_number,
        destination: row.destination,
        status: row.status,
        departedAt: row.departed_at,
        arrivedAt: row.arrived_at,
        createdAt: row.created_at,
        parcelCount: row.parcel_count,
    }
}

const TRIP_SELECT = `
SELECT t.*,
        u.name AS driver_name,
        (SELECT count(*)::int FROM parcels p WHERE p.trip_id = t.id) AS parcel_count
    FROM trips t
    JOIN users u ON u.id = t.driver_id`;

export class DriverNotFoundError extends Error {
    constructor () {
        super("Driver does not exist, is inactive or does not have the DRIVER role");
    }
}

export class TripNotFondError extends Error {
    constructor() {
        super("Trip not found")
    }
}

export class TripStateError extends Error { };
export class ParcelsNotAvailableError extends Error {
    constructor() {
        super("Some parcels cannot be added. Only registered parcels that are not already on a trip can be added. ")
    }
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
      // The SELECT only produces a row for an active user whose role is DRIVER, so anyone else is refused.
    const result = await pool.query<{id: string}>(
        `INSERT INTO trips (driver_id, vehicle_number, destination)
        SELECT id, $2, $3 FROM users WHERE id = $1 AND role = 'DRIVER'
        AND active 
        RETURNING id`,
        [input.driverId, input.vehicleNumber, input.destination]
    );

    const row = result.rows[0];
    if(!row) throw new DriverNotFoundError();
    return (await findTrip(row.id))!;
}

export async function findTrip(id: string): Promise<Trip | null> {
    const result = await pool.query<TripRow>(
        `${TRIP_SELECT} WHERE t.id = $1`, 
        [id]
    );

    const row =  result.rows[0];
    return row ? toTrip(row) : null;

}

export async function getTripDetails(id: string): Promise<TripDetails | null> {
    const trip = await findTrip(id);
    if(!trip) return null;

    const parcels = await pool.query<ParcelRow>(
        `SELECT * FROM parcels WHERE trip_id = $1 ORDER BY id`,
        [id]
    );

    return {...trip, parcels: parcels.rows.map(toParcel)};
}

/** Newest first. Pass statuses to see only some trips. */
export async function listTrips(statuses?: TripStatus[], limit = 50): Promise<Trip[]> {
    const result = statuses ? await pool.query<TripRow>(
        `${TRIP_SELECT} WHERE t.status = ANY($1::text[]) ORDER BY t.id DESC LIMIT $2`,
        [statuses, limit],
    ): await pool.query<TripRow>(`
        ${TRIP_SELECT} ORDER BY t.id DESC LIMIT $1`, [limit]);

    return result.rows.map(toTrip);
}

/** The trip a driver is loading or driving right now, if any. */
export async function findCurrentTripForDriver(driverId: string): Promise<Trip | null> {
    const result = await pool.query<TripRow>(
        `${TRIP_SELECT}
        WHERE t.driver_id = $1 AND t.status IN ('PLANNED', 'DEPARTED')
        ORDER BY t.id DESC LIMIT 1`,
        [driverId]
    );

    const row = result.rows[0];
    return row ? toTrip(row) : null;
}

/** Adds parcels to a trip that has not left yet. All or nothing: if any parcel cannot be added, none are. */
export async function assignParcels(tripId: string, parcelIds: string[]): Promise<void> {
    const unique = [...new Set(parcelIds)];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // FOR UPDATE locks the trip row, so a departure cannot slip in half-way through.
        const trip = await client.query<{ status: TripStatus }>(
            "SELECT status FROM trips WHERE id = $1 FOR UPDATE",
            [tripId]
        );

        if(!trip.rows[0]) throw new TripNotFondError();
        if(trip.rows[0].status !== "PLANNED"){
            throw new TripStateError("Parcels can only be added before the trip departs")
        }

        const updated = await client.query(
            `UPDATE parcels SET trip_id = $1
            WHERE id = ANY($2::uuid[]) AND status = 'REGISTERED' AND trip_id IS NULL`,
            [tripId, unique]
        );

        if(updated.rowCount !== unique.length) throw new ParcelsNotAvailableError();

        await client.query("COMMIT")
    } catch (error) {
        client.query("ROLLBACK");
        throw error
    }finally{
        client.release();
    }
}

/** Takes a parcel off a trip that has not left yet. Returns false if there was nothing to remove. */
export async function unassignParcel(tripId: string, parcelId: string): Promise<boolean> {
    const result = await pool.query(
        `UPDATE parcels SET trip_id = null
          WHERE id = $2 AND trip_id = $1 AND status = 'REGISTERED'
            AND EXISTS (SELECT 1 FROM trips WHERE id = $1 AND status = 'PLANNED')`,
            [tripId, parcelId],
    );

    return result.rowCount === 1;
}

interface Step {
    from: TripStatus;
    to: TripStatus;
    stamp: "departed_at" | "arrived_at";
    parcelFrom: "REGISTERED" | "IN_TRANSIT";
    parcelTo: "IN_TRANSIT" | "ARRIVED";
    wrongState: string;
}

// Moves a trip to its next status and its parcels with it, in one transaction.
async function advanceTrip(tripId: string, step: Step):Promise<void> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const moved = await client.query(
            `UPDATE trips SET status = $2, ${step.stamp} = now() WHERE id = $1 AND status = $3`,
            [tripId, step.to, step.from]
        );

        if(moved.rowCount !== 1){
            const exists = await client.query("SELECT 1 FROM trips WHERE id = $1", [tripId]);
            if(exists.rowCount === 0) throw new TripNotFondError();
            throw new TripStateError(step.wrongState);
        }

        await client.query("UPDATE parcels SET status = $2 WHERE trip_id = $1 AND status = $3", 
            [tripId,  step.parcelTo, step.parcelFrom]);

        await client.query("COMMIT")
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }finally{
        client.release();
    }
}


export function departTrip(tripId: string): Promise<void>{
    return advanceTrip(tripId, {
        from: "PLANNED",
        to: "DEPARTED",
        stamp: "departed_at",
        parcelFrom: "REGISTERED",
        parcelTo: "IN_TRANSIT",
        wrongState: "Only a trip that has not left yet can depart"
    })
}

export function arriveTrip(tripId: string): Promise<void>{
    return advanceTrip(tripId, {
        from: "DEPARTED",
        to: "ARRIVED",
        stamp: "arrived_at",
        parcelFrom: "IN_TRANSIT",
        parcelTo: "ARRIVED",
        wrongState: "Only a trip that is on the road can arrive"
    })
}