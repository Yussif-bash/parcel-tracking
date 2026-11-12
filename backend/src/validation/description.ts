import z from "zod";

export const descriptionSchema = 
z.string("Description is required")
.trim().min(1, "Description is required")
.max(300, "Description is too long");
