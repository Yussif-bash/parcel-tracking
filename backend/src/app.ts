import express, { type ErrorRequestHandler }from "express"
import { parcelRoutes } from "./parcels/parcel-routes.ts"

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
    res.status(200).json({status: "Ok"})
});

app.use("/parcels", parcelRoutes);

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