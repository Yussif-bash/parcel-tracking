import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";


export type currentUser = {
    id: string, 
    name: string,
    phone: string,
    role: "OWNER" | "ADMIN" | "CASHIER" | "DRIVER"
};

/** The logged-in user, or null. Several components can call it; it asks the backend once per request. */
export const getCurrentUser = cache(async (): Promise<currentUser | null> => {
    const cookieHeader = (await cookies()).toString();    
    if(!cookieHeader.includes("session=")) return null;

    const response = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
        headers: { cookie: cookieHeader },
        cache: "no-store"
    });

    console.log(response);
    
    if(response.status === 401) return null;
    if(!response.ok) throw new Error(`Could not check the login (status ${response.status})`);

    return response.json()
});

/** For pages that need a logged-in user: sends everyone else to the login page. */
export async function requireUser(): Promise<currentUser> {
    const user = await getCurrentUser();    
    if(!user) redirect("/login");
    
    return user;
}