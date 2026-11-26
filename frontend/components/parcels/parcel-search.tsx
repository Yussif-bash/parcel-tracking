"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import type { Parcel } from "@/lib/parcels";

export function ParcelSearch({ parcels }: { parcels: Parcel[]}){
    const [search, setSearch] = useState("");

    const filteredParcels = useMemo(() => {
        const query = search.trim().toLocaleLowerCase();

        if(!query) return [];

        return parcels.filter((parcel) => [
            parcel.trackingCode,
            parcel.senderPhone,
            parcel.receiverPhone
        ].some((value) => value?.toLocaleLowerCase().includes(query)));
    }, [parcels, search]);

    return(
        <div className="relative flex-1">
            <InputGroup className="h-10 
                rounded-lg border border-fog-100 bg-white px-3 
                text-base text-ocean-800 focus:none focus:outline-ocean-800">
                <InputGroupInput
                 placeholder="Find by trecking code or phone"
                 value={search}
                 onChange={(event) => setSearch(event.target.value)}
                 />
                <InputGroupAddon align="inline-start">
                    <SearchIcon className="text-coral-600 text-3xl"/>
                </InputGroupAddon>
            </InputGroup>
            {search.trim() && (
                <div className="absolute left-0 right-0 top-12 z-20 rounded-lg border bg-white shadow-lg">
                    {filteredParcels.length > 0 ? (
                        <div className="divide-y">
                            {filteredParcels.map((parcel) => (
                                <div
                                    key={parcel.id}
                                    className="p-4 hover:bg-fog-50"
                                >
                                    <p className="font-semibold text-ocean-800">
                                        {parcel.trackingCode}
                                    </p>
                                    <p className="text-sm text-ocean-600">
                                        Receiver: {parcel.receiverName}
                                    </p>
                                    <p className="text-sm text-ocean-600">
                                        Receiver: {parcel.receiverPhone}
                                    </p>
                                    <p className="text-sm text-ocean-600">
                                        Receiver: {parcel.status}
                                    </p>
                                    
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="p-4 text-center text-sm text-ocean-600">
                            No parcels matching "{search}" found
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}