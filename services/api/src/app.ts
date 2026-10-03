import { Hono } from "hono";
import { STALE_TRIP_MINUTES } from "@parcel/shared";

export const app = new Hono();

app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "parcel-tracking-api",
    stage: process.env.STAGE ?? "local",
    staleTripMinutes: STALE_TRIP_MINUTES,
  }),
);

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(JSON.stringify({ level: "error", message: err.message }));
  return c.json({ error: "Internal server error" }, 500);
});
