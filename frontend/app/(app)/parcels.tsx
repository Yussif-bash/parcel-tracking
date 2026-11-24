"use client"

import { useRouter } from "next/navigation"

export function ParcelButton(){
    const router = useRouter();

    function navigateToParcels(){
        router.push("/parcel")
    }

    return (
        <button 
            onClick={navigateToParcels}
            className="mt-6 inline-flex h-10 items-center rounded-lg px-4 font-medium text-white bg-coral-600">
                Create Parcel
         </button>
    )
}

