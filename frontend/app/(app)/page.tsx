import { requireUser } from "@/lib/session";
import Link from "next/link";

export default async function HomePage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];


  return (
    <>
      <h1 className="text-2xl font-medium text-ocean-800">Hello, {firstName}</h1>
        {user.role === "DRIVER" ? (
            <p className="mt-1 text-ocean-600">Your trips will appear here.</p>
          ) : (
            <>
              <p className="mt-1 text-ocean-600">Register parcels and see what has arrived.</p>
              <Link
                href="/parcels"
                className="mt-6 inline-flex h-10 items-center rounded-lg bg-coral-600 px-4 font-medium text-white hover:bg-coral-700"
              >
                Go to parcels
              </Link>
            </>
          )}

       
    </>
  );
}