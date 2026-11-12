import type { CookieOptions, Response } from "express";

export const SESSION_COOKIE = "session";

const baseOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
};

export function sessionCookieOptions(expiresAt: Date): CookieOptions{
    return {...baseOptions, expires: expiresAt};
};

export function clearCookieOptions(response: Response): void{
    response.clearCookie(SESSION_COOKIE, baseOptions)
}