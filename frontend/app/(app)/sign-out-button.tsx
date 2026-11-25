"use client"

import { LogOut, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
     AlertDialog, 
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle
    } from "@/components/ui/alert-dialog";

export function SignOutButton() {
    const router =  useRouter();
    const [pending, setPending] = useState(false);
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(false)

    async function signOut() {

        setPending(true);
        setFailed(false);

        try {
            const response = await fetch(`/api/auth/logout`, {method: "POST"});

            if(response.ok){
                router.push("/login");
                router.refresh();
                setOpen(false)
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

        <AlertDialog open={open} onOpenChange={setOpen}>
            <Button variant="ghost"
                onClick={() => {setFailed(false); setOpen(true)}}
                className="flex h-9 items-center bg-coral-600 gap-1.5 rounded-lg border border-coral-700 px-3 text-sm text-white hover:bg-coral-700 disabled:opacity-60"
            >
                <LogOut aria-hidden className="size-4"/>
            </Button>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-ocean-800 text-lg font-semi-bold">
                        Are you sure you want to log out?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-ocean-500 text-xs">
                         You will be signed out of your account and redirected to the
                         login page.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {failed && (
                    <span role="alert" className="text-xs text-coral-700">
                    Couldn&apos;t sign out. Try again.
                    </span>
                )}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={signOut}
                        disabled={pending}
                        className="bg-red-600 text-white hover:bg-red-700"
                    >
                        {pending ? (
                            <>
                                <Loader2 className="mr-2 size-4 animate-spin" />
                                Logging out...
                            </>
                            ) : (
                            "Yes, log out"
                            )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
  );
}