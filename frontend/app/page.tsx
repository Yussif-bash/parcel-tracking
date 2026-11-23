export default function Page(){
    return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="text-2xl font-semibold">Parcel tracking</h1>
      <p className="mt-2 text-fog-600">Palette check</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="rounded-md bg-ocean-500 px-4 py-2 text-white">Ocean teal</span>
        <span className="rounded-md bg-coral-600 px-4 py-2 text-white">Coral</span>
        <span className="rounded-md bg-fog-400 px-4 py-2">Fog grey</span>
      </div>
    </main>
  );
}