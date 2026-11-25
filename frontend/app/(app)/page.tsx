import { ParcelListSkeleton } from "@/components/parcels/parcel-list-skeleton";
import { ParcelSearch } from "../../components/parcels/parcel-search";
import { Skeleton } from "@/components/ui/skeleton";
import { listParcels, Parcel } from "@/lib/parcels";
import { requireUser } from "@/lib/session";
import Link from "next/link";
import { Suspense } from "react";
import { ParcelList } from "./parcels/parcel-list";
import { Plus } from "lucide-react";

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
    <div className="flex flex-col justify-center rounded-md bg-fog-50 p-4 w-full">
      <p className="text-ocean-800 text-center">Parcels Created Today</p>
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

async function ParcelSearchSection({parcelsPromise}: {parcelsPromise: Promise<Parcel[]>}) {
  const parcels = await parcelsPromise;

  return <ParcelSearch parcels={parcels}/>
}

export default async function HomePage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];
  const parcelsPromise = listParcels();

  return (
    <>
      <h1 className="text-2xl font-medium text-ocean-800">Hello, {firstName}</h1>
        {user.role === "DRIVER" ? (
            <p className="mt-1 text-ocean-600">Your trips will appear here.</p>
          ) : (
            <>
              <p className="mt-1 text-ocean-600">Register parcels and see what has arrived.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center my-4">
                <Link
                  href="/parcels"
                  className="inline-flex h-10 items-center rounded-lg bg-coral-600 px-4 font-medium text-white hover:bg-coral-700"
                >
                  <Plus className="me-2"/>
                   Register a parcel
                </Link>

                <Suspense
                  fallback={<Skeleton className="h-10 "/>}
                >
                  <ParcelSearchSection parcelsPromise={parcelsPromise}/>
                </Suspense>
                
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <Suspense
                  fallback={
                    <div className="space-y-2 rounded-md bg-fog-500 p-2 ">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mx-auto h-9 w-12" />
                    </div>
                  }
                >
                  <TodayParcelCount parcelsPromise={parcelsPromise} />
                </Suspense>
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

               <section className="mt-8">
                <h2 className="mb-3 text-lg font-medium text-ocean-800">
                  Recent parcels
                </h2>

                <Suspense fallback={<ParcelListSkeleton count={(await parcelsPromise).length} />}>
                  <RecentParcels parcelsPromise={parcelsPromise} />
                </Suspense>
              </section>
            </>
          )}

       
    </>
  );
}