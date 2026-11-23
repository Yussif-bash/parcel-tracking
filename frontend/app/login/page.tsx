import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="bg-fog-400 mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-3xl font-semibold text-ocean-800">Parcel tracking</h1>
      <p className="mt-1 text-ocean-500">Sign in to continue</p>
      <div className="mt-6 rounded-xl border border-fog-200 bg-white p-6 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}