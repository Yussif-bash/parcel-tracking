"use client";

import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent} from "react";

function errorMessage(status: number, body: unknown): string {
    const data = body as { error: string, details: {message: string}[] } | null;
    if(status === 400 && data?.details?.[0]) return data.details[0].message;
    if(data?.error) return data.error;
    return "Something went wrong. Please try again";
};

const inputClass =
  "h-10 w-full rounded-lg border border-ocean-100 bg-white px-3 text-base text-ocean-800 focus:border-ocean-500 focus:outline-none";


export function LoginForm(){
    const router = useRouter();
    const [ error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(event:FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);
        const formElement = event.currentTarget;
        const form = new FormData(formElement);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({phone: form.get("phone"), password: form.get("password")})
            });

            if(response.ok){
                router.push("/");
                router.refresh();
                return;
            };

            setError(errorMessage(response.status, await response.json().catch(() => null)));
        } catch (error) {
            setError("Could not reach the server. Check your connection and try again.");
        }finally{
            setSubmitting(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
            <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-coral-500 bg-coral-50 px-3 py-2.5 text-sm text-coral-700"
            >
            <CircleAlert aria-hidden className="mt-0.5 size-[18px] shrink-0" />
            <span>{error}</span>
            </div>
        )}

        <div>
            <label htmlFor="phone" className="block text-sm font-medium text-ocean-800">
            Phone number
            </label>
            <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            aria-describedby="phone-help"
            className={`mt-1 ${inputClass}`}
            placeholder="Enter your phone number"
            />
        </div>

        <div>
            <label htmlFor="password" className="block text-sm font-medium text-ocean-800">
            Password
            </label>
            <div className="relative mt-1">
            <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className={`${inputClass} pr-11`}
                placeholder="Enter your password"
            />
            <button
                type="button"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md text-fog-600 hover:bg-fog-100 hover:text-fog-900"
            >
                {showPassword ? (
                <EyeOff aria-hidden className="size-[18px] text-ocean-600" />
                ) : (
                <Eye aria-hidden className="size-[18px] text-ocean-600" />
                )}
            </button>
            </div>
        </div>

        <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-lg bg-coral-600 font-medium text-white hover:bg-coral-700 disabled:opacity-60"
        >
            {submitting ? "Signing in…" : "Sign in"}
        </button>
        </form>
    );
}