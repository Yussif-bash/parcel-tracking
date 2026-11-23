import React from "react";
import "./globals.css"

export default function RootLayout({ children }: {children: React.ReactNode}){
    return(
        <html lang="en">
            <body className="bg-fog-400 text-fog-900">
                {children}
            </body>
        </html>
    )
}