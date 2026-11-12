import z from "zod";
import { phoneSchema } from "../validation/phone.ts";
import { nameSchema } from "../validation/name.ts";

export const USER_ROLES = ["OWNER", "ADMIN", "DRIVER", "CASHIER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const createUserSchema = z.object({
    name: nameSchema,
    phone: phoneSchema,
    role: z.enum(USER_ROLES, {error: "Role must be OWNER, ADMIN, CASHIER or DRIVER"})
});

export type CreateUserInput = z.infer<typeof createUserSchema>