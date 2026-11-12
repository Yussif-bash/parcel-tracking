import z from "zod";

export const phoneSchema = z
    .string("Phone number is required")
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .transform((value) => (/^0\d{9}$/.test(value) ? `+233${value.slice(1)}` : value))
    .refine(
        (value) => /^\+[1-9]\d{7,14}$/.test(value),
        "Enter a phone number like 0241234567 or +233241234567",
    );