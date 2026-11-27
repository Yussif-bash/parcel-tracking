import type { Response } from "express";
import { ZodError } from "zod";

/** Replies 400 with one entry per invalid field, in the same shape every route uses. */
export function sendValidationError(res: Response, error: ZodError, message: string): void{
    res.status(400).json({
        error: message,
        details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }))
    })
}