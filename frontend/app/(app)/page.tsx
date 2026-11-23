import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const firstName = user.name.split(" ")[0];

  return (
    <>
      <h1 className="text-2xl font-medium">Hello, {firstName}</h1>
      <p className="mt-1 text-fog-600">Parcels are coming next.</p>
    </>
  );
}