import { Suspense } from "react";
import { redirect } from "next/navigation";

import { listParcels, type Parcel } from "@/lib/parcels";
import { requireUser } from "@/lib/session";

import { ParcelList } from "./parcel-list";
import { RegisterParcelForm } from "./register-parcel-form";
import { Skeleton } from "@/components/ui/skeleton";



export default async function ParcelsPage() {
  const user = await requireUser();

  if (user.role === "DRIVER") redirect("/");

  // Start fetching parcels without blocking the page render.

  return (
    <>
      <p className="mt-1 text-ocean-600">
        Register a parcel and see the latest ones.
      </p>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium text-ocean-800">
          Register a parcel
        </h2>
        <RegisterParcelForm />
      </section>

     
    </>
  );
}
