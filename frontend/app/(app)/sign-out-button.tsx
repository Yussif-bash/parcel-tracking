"use client"

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
    const router =  useRouter();
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);

    async function signOut() {

        setPending(true);
        setFailed(false);

        try {
            const response = await fetch(`/api/auth/logout`, {method: "POST"});

            if(response.ok){
                router.push("/login");
                router.refresh();
                return
            }

            setFailed(true)
        } catch (error) {
            setFailed(true)
        }finally{
            setPending(false)
        }
        
    }

     return (
        <div className="flex items-center gap-2">
            {failed && (
                <span role="alert" className="text-xs text-coral-700">
                Couldn&apos;t sign out. Try again.
                </span>
            )}
            <button
                type="button"
                onClick={signOut}
                disabled={pending}
                className="flex h-9 items-center bg-coral-600 gap-1.5 rounded-lg border border-coral-500 px-3 text-sm text-white hover:bg-coral-700 disabled:opacity-60"
            >
                Sign out
                <LogOut aria-hidden className="size-4" />
            </button>
        </div>
  );
}