"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent} from "react";

function errorMessage(status: number, body: unknown): string {
    const data = body as { error: string, details: {message: string}[] } | null;
    if(status === 400 && data?.details?.[0]) return data.details[0].message;
    if(data?.error) return data.error;
    return "Something went wrong. Please try again";
};


export function LoginForm(){
    const router = useRouter();
    const [ error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(event:FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        const form = new FormData(event.currentTarget);

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
            }

            setError(errorMessage(response.status, await response.json().catch(() => null)));
        } catch (error) {
            setError("Could not reach the server. Check your connection and try again.");
        }finally{
            setSubmitting(false);
        }
    };
    return(
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-fog-700">
                Phone number
                </label>
                <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                className="mt-1 block w-full rounded-md border border-fog-300 bg-white px-3 py-2 text-fog-900 focus:border-ocean-600 focus:outline-none focus:ring-2 focus:ring-ocean-600/30"
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-fog-700">
                Password
                </label>
                <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-md border border-fog-300 bg-white px-3 py-2 text-fog-900 focus:border-ocean-600 focus:outline-none focus:ring-2 focus:ring-ocean-600/30"
                />
            </div>

            {error && (
                <p
                role="alert"
                className="rounded-md border border-coral-500 bg-coral-50 px-3 py-2 text-sm text-coral-700"
                >
                {error}
                </p>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-coral-600 px-4 py-2 font-medium text-white hover:bg-coral-500 disabled:opacity-60"
            >
                {submitting ? "Signing in…" : "Sign in"}
            </button>

            <hr />
            <button 
                className="w-full rounded-md px-4 border border-coral-50 py-2 font-medium text-fog-700 hover:bg-coral-600 hover:text-white disabled:opacity-60">
                Sign in With Google
            </button>
            <button 
               className="w-full rounded-md border border-coral-50 px-4 py-2 font-medium text-fog-700 hover:bg-coral-500 hover:text-white disabled:opacity-60"
               >Sign in with Facebook
            </button>
        </form>
    );
}