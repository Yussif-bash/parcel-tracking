import { Parcel, ParcelStatus } from "@/lib/parcels";


const statusStyles: Record<ParcelStatus, {label: string, className: string}> = {
    REGISTERED: {label: "Registered", className: "bg-fog-200 text-fog-900"},
    IN_TRANSIT: {label: "In transit", className: "bg-ocean-100 text-ocean-800"},
    ARRIVED: {label: "Arrived", className: "bg-ocean-600 text-white"},
    COLLECTED: {label: "Collected", className: "bg-fog-100 text-fog-700"},
    CANCELLED: {label: "Cancelled", className: "bg-coral-50 text-coral-700"}
};

const timeFormat = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Accra",
});


export function ParcelList({ parcels }: { parcels: Parcel[]}){
    if(parcels.length === 0){
        return (
        <div className="rounded-xl border border-dashed border-fog-300 bg-white p-8 text-center">
            <p className="font-medium">No parcels yet</p>
            <p className="mt-1 text-sm text-fog-600">Registered parcels will appear here.</p>
        </div>
        );
    }


  return (
    <ul className="divide-y divide-fog-200 overflow-hidden rounded-xl border border-fog-200 bg-white">
      {parcels.map((parcel) => {
        const status = statusStyles[parcel.status];
        return (
          <li
            key={parcel.id}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="font-mono text-sm font-medium">{parcel.trackingCode}</p>
              <p className="truncate text-sm text-fog-600">
                To {parcel.receiverName} · {parcel.receiverPhone}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-fog-600">
              <span>{timeFormat.format(new Date(parcel.createdAt))}</span>
              <span className={`rounded-full px-2.5 py-1 font-medium ${status.className}`}>
                {status.label}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}