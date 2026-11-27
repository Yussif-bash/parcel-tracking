import { Router } from "express";
import { listDrivers } from "./user-repository.ts";

export const driverRoutes =  Router();

driverRoutes.get("/", async (_req, res) => {
    res.json(await listDrivers());
});