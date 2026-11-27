import type { TripStatus } from "@/lib/trips";

const styles: Record<TripStatus, {label: string, className: string}> = {
    PLANNED: {label: "Loading", className: "bg-fog-200 text-fog-900"},
    DEPARTED: {label: "On the road", className: "bg-ocean-100, text-ocean-800"},
    ARRIVED: {label: "Arrived", className: "bg-ocean-600 text-white"},
    CANCELLED: {label: "Cancelled", className: "bg-coral-50 text-coral-700"},
};

export function TripStatusBadge({status} : {status: TripStatus}){
    const {label, className} = styles[status];
    return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>
}