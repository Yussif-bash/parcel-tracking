import { Suspense } from "react";
import { redirect } from "next/navigation";

import { listParcels, type Parcel } from "@/lib/parcels";
import { requireUser } from "@/lib/session";

import { ParcelList } from "./parcel-list";
import { ParcelListSkeleton } from "@/components/parcels/parcel-list-skeleton";
import { RegisterParcelForm } from "./register-parcel-form";
import { Skeleton } from "@/components/ui/skeleton";

function getAccraDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Accra",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function TodayParcelCount({ parcelsPromise }: { parcelsPromise: Promise<Parcel[]> }) {
  const parcels = await parcelsPromise;
  const today = getAccraDateKey(new Date());

  const todayParcels = parcels.filter(
    (parcel) => getAccraDateKey(new Date(parcel.createdAt)) === today
  );

  return (
    <div className="flex flex-col justify-center rounded-md bg-fog-50 p-2">
      <p className="text-ocean-800">Parcels Created Today</p>
      <p className="text-center text-3xl font-bold text-coral-600">
        {todayParcels.length}
      </p>
    </div>
  );
}

async function RecentParcels({ parcelsPromise }: { parcelsPromise: Promise<Parcel[]> }) {
  const parcels = await parcelsPromise;
  return <ParcelList parcels={parcels} />;
}

export default async function ParcelsPage() {
  const user = await requireUser();

  if (user.role === "DRIVER") redirect("/");

  // Start fetching parcels without blocking the page render.
  const parcelsPromise = listParcels();

  return (
    <>
      <div className="flex justify-between">
        <h1 className="text-2xl font-medium text-ocean-800">
          Parcels
        </h1>

        <Suspense
          fallback={
            <div className="space-y-2 rounded-md bg-fog-500 p-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mx-auto h-9 w-12" />
            </div>
          }
        >
          <TodayParcelCount parcelsPromise={parcelsPromise} />
        </Suspense>
      </div>

      <p className="mt-1 text-ocean-600">
        Register a parcel and see the latest ones.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium text-ocean-800">
          Register a parcel
        </h2>
        <RegisterParcelForm />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">
          Recent parcels
        </h2>

        <Suspense fallback={<ParcelListSkeleton count={(await parcelsPromise).length} />}>
          <RecentParcels parcelsPromise={parcelsPromise} />
        </Suspense>
      </section>
    </>
  );
}
