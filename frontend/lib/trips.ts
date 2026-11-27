import { backendGet } from "./backend";
import { Parcel } from "./parcels";

export type TripStatus = "PLANNED" | "DEPARTED" | "ARRIVED" | "CANCELLED";

export type Trip = {
    id: string;
    driverId: string;
    driverName: string;
    vehicleNumber: string;
    destination: string;
    status: TripStatus;
    createdAt: string;
    departedAt: string;
    arrivedAt: string;
    parcelCount: number;
}

export type TripDetails = Trip & {parcels: Parcel[]};
export type Driver = {id: string; name: string; phone: string};


export const listTrips = () => backendGet<Trip[]>("/trips");
export const listDrivers = () => backendGet<Driver[]>("/drivers");
export const getTrip = (id: string) => backendGet<TripDetails>(`/trips/${id}`);

