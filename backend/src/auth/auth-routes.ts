import { Router } from "express";
import z from "zod";
import { findUserByPhone, recordFailedLogin, recordSuccessfulLogin, updatePassword } from "../users/user-repository.ts";
import { phoneSchema } from "../validation/phone.ts";
import { clearCookieOptions, sessionCookieOptions, SESSION_COOKIE} from "./cookie.ts";
import { hashPassword, verifyPassword } from "./password.ts";
import { createSession, deleteSession, deleteSessionForUser } from "./session-repository.ts";
import { requireLogin } from "./auth-middleware.ts";
import { changedPasswordSchema } from "./password-schema.ts";
import { loginSchema } from "./auth-schema.ts";

export const authRoutes = Router();

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
    const user =  await findUserByPhone(phone);

    if(user && user.lockSecondsLeft > 0){
        const minutes = Math.ceil(user.lockSecondsLeft / 60);
        res.status(429).json({
            error: `Too many attempts: Try again in ${minutes} minute${minutes === 1 ? " " : "s"}`
        });
        return
    }

    
    const passwordIsCorrect = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));

    if(user && !passwordIsCorrect){
        await recordFailedLogin(user.id)
    }

    if(!user || !user.active || !passwordIsCorrect){
        res.status(401).json({error: "Wrong phone number or password"});
        return
    };
 
    await recordSuccessfulLogin(user.id);

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

authRoutes.post("/change-password", requireLogin, async (req, res) => {

    const result = changedPasswordSchema.safeParse(req.body);

    if(!result.success){
        res.status(400).json({
            error: "Invalid password change",
            details: result.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    return;
    }


    const {currentPassword, newPassword} = result.data;
    const account = await findUserByPhone(req.user!.phone);

    if (!account) {
        res.status(401).json({ error: "Please log in" });
        return;
    };


  // Guessing the current password through this route counts like guessing at the login.
  if (account.lockSecondsLeft > 0) {
    const minutes = Math.ceil(account.lockSecondsLeft / 60);
    res.status(429).json({
      error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    });
    return;
  };

  const verifiedCurrentPassword = await verifyPassword(currentPassword, account.passwordHash);

  if (!verifiedCurrentPassword) {
    await recordFailedLogin(account.id);
    res.status(401).json({ error: "Current password is wrong" });
    return;
  }

  await recordSuccessfulLogin(account.id);
  await updatePassword(account.id, await hashPassword(newPassword));

  // A new password ends every old session (a stolen cookie stops working), then starts a fresh one here.
  await deleteSessionForUser(account.id);
  const { token, expiresAt } = await createSession(account.id);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(expiresAt));
  res.status(204).end();
})

authRoutes.get("/me", requireLogin, (req, res) => {
    res.json(req.user)
})