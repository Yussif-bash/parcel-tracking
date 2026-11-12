import z from "zod";

export const nameSchema = 
z.string("Name is required")
.trim().min(1,"Name is required")
.max(120, "Name is too long");
