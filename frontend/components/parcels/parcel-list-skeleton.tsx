
import { Skeleton } from "@/components/ui/skeleton";

export function ParcelListSkeleton({ count = 5 }: {  count?: number;}) {
  return (
    <ul
      aria-label="Loading parcels"
      aria-busy="true"
      className="divide-y divide-fog-200 overflow-hidden rounded-xl border border-fog-200 bg-fog-500"
    >
      {Array.from({ length: count }).map((_, index) => (
        <li
          key={index}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>

          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
