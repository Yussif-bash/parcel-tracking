import z from "zod"
import { phoneSchema } from "../validation/phone.ts";

export const loginSchema = z.object({
    phone: phoneSchema,
    password: z.string({error: "Passwrod is required"})
    .min(1, "Password is required")
    .max(128, "Password is too long")
});