import React from "react";
import "./globals.css"
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


export default function RootLayout({ children }: {children: React.ReactNode}){
    return(
        <html lang="en" className={cn("font-sans", geist.variable)}>
            <body className="bg-fog-400 text-fog-900">
                {children}
            </body>
        </html>
    )
}