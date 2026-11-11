import {Router} from "express"
import { createParcel, deleteParcels, listParcels } from "./parcel-repository.ts"
import { createParcelSchema } from "./parcel-schema.ts"

export const parcelRoutes = Router();

parcelRoutes.post("/", async(req, res) => {
    const result = createParcelSchema.safeParse(req.body);

    if(!result.success){
        res.status(400).json({
            error: "Invalid Parcel",
            details: result.error.issues.map((issues) => ({
                field: issues.path.join("."),
                message: issues.message
            }))
        })
        return
    }

    const parcel = await createParcel(result.data);
    res.status(201).json(parcel)
})

parcelRoutes.get("/", async (_req, res) => {
    res.status(200).json(await listParcels())
});

parcelRoutes.delete("/", async (_req, res) => {
    res.status(200).json(await deleteParcels())
})