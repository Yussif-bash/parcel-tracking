import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL;

if(!backendUrl){
    throw new Error("BACKEND_URL is not set. Copy .env.example to .env.local and fill it in.")
}

const nextConfig: NextConfig = {
    async rewrites() {
        return[{source: "/api/:path*", destination: `${backendUrl}/:path*`}]   
    }
}

export default nextConfig