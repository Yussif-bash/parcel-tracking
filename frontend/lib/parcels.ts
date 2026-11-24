import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ParcelStatus = "REGISTERED" | "IN_TRANSIT" | "ARRIVED" | "COLLECTED" | "CANCELLED";

export type Parcel = {
    id: string;
    trackingCode: string;
    senderName: string;
    senderPhone: string;
    receiverName: string;
    receiverPhone: string;
    description: string;
    status: ParcelStatus;
    createdAt: string;
}

export async function listParcels():Promise<Parcel[]> {
    const response = await fetch(`${process.env.BACKEND_URL}/parcels`, {
        headers: {cookie: (await cookies()).toString()},
        cache: "no-store",
    });


    if(response.status === 401) redirect("/login");
    if(!response.ok) throw new Error(`Could not load parcels (status ${response.status})`);
    return response.json()
}