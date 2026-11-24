import { redirect } from "next/navigation";
import { listParcels } from "@/lib/parcels";
import { requireUser } from "@/lib/session";
import { ParcelList } from "./parcel-list";
import { RegisterParcelForm } from "./register-parcel-form";

export default async function ParcelsPage() {
    const user  = await requireUser();

    if(user.role === "DRIVER") redirect("/");

    const parcels = await listParcels();

    return (
    <>
      <div className="flex justify-between">
        <h1 className="text-2xl font-medium text-ocean-800">Parcels</h1>
        <p className="text-ocean-800 font-medium">Hello, {user.name}</p>
      </div>
      <p className="mt-1 text-ocean-600">Register a parcel and see the latest ones.</p>
        

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium text-ocean-800">Register a parcel</h2>
        <RegisterParcelForm />
      </section> 

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Recent parcels</h2>
        <ParcelList parcels={parcels} />
      </section>
    </>
  );

}