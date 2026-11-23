import {Package} from "lucide-react";
import { requireUser } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";
import React from "react";

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
        <header className="border-b border-ocean-200 bg-ocean-800">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex items-center gap-2 font-medium text-fog-400">
                <Package aria-hidden className="size-5 text-coral-600" />
                SendTrack
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right leading-tight bg-coral-50 py-1 px-6 rounded-md">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-fog-600">{roleLabels[user.role]}</p>
                </div>
                <SignOutButton />
            </div>
            </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </div>
  );
}   