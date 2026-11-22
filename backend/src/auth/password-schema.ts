import z from "zod"

export const MIN_PASSWORD_LENGTH = 12;

const newPasswordSchema = z
.string({error: "New password is required"})
.min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`)
.max(128, "Password is too long")

const currentPasswordSchema = z
.string({error: "Current password is required"})
.min(1, "Current password is required")
.max(128, "Password is too long")

export const changedPasswordSchema = z
.object({
    currentPassword: currentPasswordSchema,
    newPassword: newPasswordSchema 
})
.refine((value) => value.newPassword !== value.currentPassword, {
    path: ["newPassword"],
    error: "Choose a different password from the current one"
})