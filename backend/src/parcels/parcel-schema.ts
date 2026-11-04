import z from "zod";

const nameSchemma = z.string().trim().min(1,"Name is required").max(120, "Name is too long");

const descriptionSchema = z.string().trim().min(1, "Description is required").max(300, "Description is too long");

const phoneSchema = z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .transform((value) => (/^0\d{9}$/.test(value) ? `+233${value.slice(1)}` : value))
    .refine(
        (value) => /^\+[1-9]\d{7,14}$/.test(value),
        "Enter a phone number like 0241234567 or +233241234567",
    );

export const createParcelSchema = z.object({
    senderName: nameSchemma,
    senderPhone: phoneSchema,
    receiverName: nameSchemma,
    receiverPhone: phoneSchema,
    description: descriptionSchema
})

export type CreateParcelInput = z.infer<typeof createParcelSchema>