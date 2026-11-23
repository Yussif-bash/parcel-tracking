import { ChartColumn, MessageSquare, Package, Receipt } from "lucide-react";
import { LoginForm } from "./login-form";

const benefits = [
  { icon: Receipt, text: "Register a parcel in seconds" },
  { icon: MessageSquare, text: "Customers get SMS updates" },
  { icon: ChartColumn, text: "Owners see every trip" },
];

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-fog-200 bg-white md:min-h-[28rem] md:grid-cols-[5fr_7fr]">
        <section className="flex flex-col justify-between gap-8 bg-ocean-800 p-6 md:p-8">
          <div className="flex items-center gap-2 font-medium text-white">
            <Package aria-hidden className="size-6 text-coral-600" />
            Parcel tracking
          </div>

          <div className="hidden md:block">
            <div className="mb-4 h-1 w-9 bg-coral-500" />
            <p className="text-2xl font-medium leading-tight text-white">
              Know where every parcel is
            </p>
            <ul className="mt-5 space-y-3">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-ocean-100">
                  <Icon aria-hidden className="size-[18px] text-coral-600" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="hidden text-xs text-coral-600 md:block">For station staff and drivers</p>
        </section>

        <section className="flex flex-col justify-center p-6 md:p-10">
          <h1 className="text-3xl font-bold text-ocean-800">Welcome back</h1>
          <p className="mt-1 text-sm text-ocean-600">Sign in with your phone number</p>
          <div className="mt-6">
            <LoginForm />
          </div>
          <p className="mt-6 text-center text-sm text-ocean-600">
            Need an account? Ask your station owner.
          </p>
        </section>
      </div>
    </main>
  );
}