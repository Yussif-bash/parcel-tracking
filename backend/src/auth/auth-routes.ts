import { Router } from "express";
import z from "zod";
import { findUserByphone } from "../users/user-repository.ts";
import { phoneSchema } from "../validation/phone.ts";
import { clearCookieOptions, sessionCookieOptions, SESSION_COOKIE} from "./cookie.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { createSession, deleteSession } from "./session-repository.ts";
import { requireLogin } from "./auth-middleware.ts";

export const authRoutes = Router();

const loginSchema = z.object({
    phone: phoneSchema,
    password: z.string({error: "Passwrod is required"})
    .min(1, "Password is required")
    .max(128, "Password is too long")
});

const dummyHash = hashPassword("a password nobody has");

authRoutes.post("/login", async(req, res) => {
    const result = loginSchema.safeParse(req.body);

    if(!result.success){
        res.status(400).json({
            error: "Invalid Login",
            details: result.error.issues.map((issues) => ({
                field: issues.path.join(" . "),
                message: issues.message
            }))
        });
        return
    };

    const { phone, password } = result.data;
    const user =  await findUserByphone(phone);
    const passwordIsCorrect = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

    if(!user || !user.active || !passwordIsCorrect){
        res.status(401).json({error: "Wrong phone number or password"});
        return
    };

    const { token,  expiresAt } = await createSession(user.id);

    res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));

    const {passwordHash: _passwordHash, ...safeUser } = user;
    res.json(safeUser);
});

authRoutes.post("/logout", async(req, res) => {
    const token: unknown = req.cookies?.[SESSION_COOKIE];

    if(typeof token === "string"){
        await deleteSession(token)
    };

    clearCookieOptions(res);
    res.status(204).end();
})

authRoutes.get("/me", requireLogin, (req, res) => {
    res.json(req.user)
})