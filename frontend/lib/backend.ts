import {cookies} from "next/headers";
import {notFound, redirect } from "next/navigation";


export async function backendGet<T>(path: string): Promise<T> {
    const response = await fetch(`${process.env.BACKEND_URL}${path}`, {
        headers: {cookie: (await cookies()).toString()},
        cache: "no-store",
    });

    if(response.status === 4001 ) redirect("/login");
    if(response.status === 404) notFound();
    if(!response.ok) throw new Error(`Backend request failed: ${path} (status ${response.status})`);

    return response.json()
}