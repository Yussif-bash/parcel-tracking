import type { CreateParcelInput } from "./parcel-schema.ts";
import { generateTrackingCode } from "./tracking-code.ts";
import { pool } from "../db.ts";

export type ParcelStatus = "REGISTERED" | "IN_TRANSIT" | "ARRIVED" | "COLLECTED" | "CANCELLED";

export interface Parcel {
  id: string;
  trackingCode: string;
  senderName: string;
  senderPhone: string;
  receiverName: string;
  receiverPhone: string;
  description: string;
  status: ParcelStatus;
  createdAt: Date;
}

interface ParcelRow {
  id: string;
  tracking_code: string;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  description: string;
  status: ParcelStatus;
  created_at: Date;
}

function toParcel(row: ParcelRow): Parcel {
    return{
        id: row.id,
        trackingCode: row.tracking_code,
        senderName: row.sender_name,
        senderPhone: row.sender_phone,
        receiverName: row.receiver_name,
        receiverPhone: row.receiver_phone,
        description: row.description,
        status: row.status,
        createdAt: row.created_at
    }
}

const UNIQUE_VIOLATION ="23505"
const MAX_LIMIT = 5

function isTrackingCodeClash(err: unknown): boolean{
    return(
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        err.code === UNIQUE_VIOLATION &&
        "constraint" in err &&
        err.constraint === "parcels_tracking_code_key"
    )
}

export async function createParcel(input: CreateParcelInput): Promise<Parcel>{
    for (let attempt = 1; attempt <= MAX_LIMIT; attempt++){
        try {
            const result = await pool.query<ParcelRow>(
            ` INSERT INTO parcels (tracking_code, sender_name, sender_phone, receiver_name, receiver_phone, description)
            VALUES( $1, $2, $3, $4, $5, $6)
            RETURNING * `,

            [
                generateTrackingCode(),
                input.senderName,
                input.senderPhone,
                input.receiverName,
                input.receiverPhone,
                input.description,
            ]
        );
        return toParcel(result.rows[0]!)
        } catch (error) {
            if(!isTrackingCodeClash(error) || attempt === MAX_LIMIT) throw error
        }
    }

    throw new Error("Could not create a unique tracking code");
}

export async function listParcels(limit = 100): Promise<Parcel[]> {
    const result = await pool.query(`
        SELECT * FROM parcels ORDER BY id DESC LIMIT $1`, 
        [limit]
    );
    
    return result.rows.map(toParcel)
}