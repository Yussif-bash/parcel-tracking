import type { RequestHandler } from "express";
import type { User } from "../users/user-repository.ts";
import { SESSION_COOKIE } from "./cookie.ts";
import { findUserBySessionToken } from "./session-repository.ts";
import type { UserRole } from "../users/users-schema.ts";


declare global{
    namespace Express{ 
        interface Request{
            user?: User
        }
    }
}

export const requireLogin: RequestHandler = async(req, res, next) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    const user = typeof token === "string" ? await findUserBySessionToken(token) : null;

    if(!user) {
        res.status(401).json({error: "Please Login"});
        return
    }

    req.user = user;
    next()
}


export function requireRole(...allowed: UserRole[]): RequestHandler{
    return((req, res, next) => {
        if(!req.user || !allowed.includes(req.user.role)){
            res.status(403).json({error: "Your are not authorized to perform this operation"});
            return
        };
        next()
    });
    
}