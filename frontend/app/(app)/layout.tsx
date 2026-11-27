import {Package} from "lucide-react";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";
import React from "react";
import Link from "next/link";

const roleLabels ={
    ADMIN: "ADMIN",
    OWNER:  "OWNER",
    CASHIER: "CASHIER",
    DRIVER: "DRIVER"
} as const


export default async function AppLayout({children}:{children: React.ReactNode}) {
    const user = await requireUser();

     return (
        <div className="min-h-screen">
            <header className="border-b border-ocean-200 bg-ocean-800 sticky top-0 z-50">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link href="/">
                        <div className="flex items-center gap-2 font-medium text-fog-400">
                            <Package aria-hidden className="size-5 text-coral-600" />
                            SendTrack
                        </div>
                    </Link>
                    {user.role !== "DRIVER" && (
                    <nav aria-label="Main" className="flex items-center gap-1 text-sm">
                        <Link href="/parcels" className="rounded-md px-3 py-1.5 text-fog-400 hover:bg-fog-100 hover:text-ocean-800">
                        Parcels
                        </Link>
                        <Link href="/trips" className="rounded-md px-3 py-1.5 text-fog-400 hover:bg-fog-100 hover:text-ocean-800">
                        Trips
                        </Link>
                    </nav>
                    )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right leading-tight">
                        <p className="text-sm font-medium text-fog-400">{user.name}</p>
                        <p className="text-xs text-coral-600">{roleLabels[user.role]}</p>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
  );
}   