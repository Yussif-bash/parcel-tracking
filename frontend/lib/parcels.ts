import { backendGet } from "./backend";

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
    tripId: string | null
    createdAt: string;
}

export const listParcels = () => backendGet<Parcel[]>("/parcels")