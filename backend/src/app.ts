import express, { type ErrorRequestHandler }from "express"
import cookieParser from "cookie-parser";
import { parcelRoutes } from "./parcels/parcel-routes.ts"
import { authRoutes } from "./auth/auth-routes.ts";
import { requireLogin, requireRole } from "./auth/auth-middleware.ts";
import { tripRoutes } from "./trips/trip-routes.ts";
import { driverRoutes } from "./users/driver-routes.ts";

export const app = express();

app.use(express.json());
app.use(cookieParser())

app.get("/health", (_req, res) => {
    res.status(200).json({status: "Ok"})
});

app.use("/parcels", requireLogin, requireRole("CASHIER"), parcelRoutes);
app.use("/trips", requireLogin, tripRoutes);
app.use("/drivers", requireLogin, requireRole("ADMIN", "CASHIER", "OWNER"), driverRoutes)
app.use("/auth", authRoutes)

app.use((_req, res) => {
    res.status(404).json({error: "Not Found"})
});

function isMalformedJson (error: unknown): boolean {
    return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  );
}
const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
    if(isMalformedJson(error)){
        response.status(400).json({ error: "Request body is not valid JSON" })
        return;
    }

    console.log(error);
    response.status(500).json({error: "Something went wrong"})
}

app.use(errorHandler)