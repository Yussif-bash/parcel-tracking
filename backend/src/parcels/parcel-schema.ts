import z from "zod";
import { nameSchema } from "../validation/name.ts";
import { descriptionSchema } from "../validation/description.ts";
import { phoneSchema } from "../validation/phone.ts";

export const createParcelSchema = z.object({
    senderName: nameSchema,
    senderPhone: phoneSchema,
    receiverName: nameSchema,
    receiverPhone: phoneSchema,
    description: descriptionSchema
})

export type CreateParcelInput = z.infer<typeof createParcelSchema>