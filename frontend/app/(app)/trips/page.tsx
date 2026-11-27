import { redirect } from "next/navigation";
import { listDrivers, listTrips } from "@/lib/trips";
import { requireUser } from "@/lib/session";
import { NewTripForm } from "./new-trip-form";
import { TripList } from "./trip-list";

export default async function TripsPage() {
  const user = await requireUser();
  if (user.role === "DRIVER") redirect("/");

  const [trips, drivers] = await Promise.all([listTrips(), listDrivers()]);

  return (
    <>
      <h1 className="text-2xl font-medium text-ocean-800">Trips</h1>
      <p className="mt-1 text-ocean-500">Load parcels onto a vehicle and send it off.</p>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium text-ocean-800">New trip</h2>
        <NewTripForm drivers={drivers} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium text-ocean-800">Recent trips</h2>
        <TripList trips={trips} />
      </section>
    </>
  );
}