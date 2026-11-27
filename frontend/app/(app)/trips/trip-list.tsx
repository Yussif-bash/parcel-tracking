import Link from "next/link";
import type { Trip } from "@/lib/trips";
import { TripStatusBadge } from "./trip-status-badge";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra"
});

export function TripList({trips}: {trips: Trip[]}){
    if(trips.length === 0){
        return (
            <div className="rounded-xl border border-dashes border-fog-300 bg-white p-8 text-center">
                <p className="font-medium">No trips yet</p>
                <p className="mt-1 text-sm text-fog-900">Create a trip above to start loading parcels</p>
            </div>
        )
    }

    return (
    <ul className="divide-y divide-fog-200 overflow-hidden rounded-xl border border-fog-200 bg-white">
      {trips.map((trip) => (
        <li key={trip.id}>
          <Link
            href={`/trips/${trip.id}`}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 hover:bg-fog-50"
          >
            <div className="min-w-0">
              <p className="font-medium text-ocean-800">{trip.destination}</p>
              <p className="truncate text-sm text-ocean-500">
                {trip.vehicleNumber} · {trip.driverName}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-ocean-500">
              <span>
                {trip.parcelCount} {trip.parcelCount === 1 ? "parcel" : "parcels"}
              </span>
              <span>{timeFormat.format(new Date(trip.createdAt))}</span>
              <TripStatusBadge status={trip.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}