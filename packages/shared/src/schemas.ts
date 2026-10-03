import { z } from "zod";
import { MAX_PARCELS_PER_TRIP, NOTIFY_AHEAD } from "./constants.js";

/** International format, for example +233241234567. Replace with libphonenumber-js validation in the API layer. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Use international format, for example +233241234567");

export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

export const pointSchema = z.object({ lat: latitudeSchema, lng: longitudeSchema });
export type Point = z.infer<typeof pointSchema>;

export const pickupPointSchema = pointSchema.extend({
  label: z.string().trim().max(120).optional(),
});
export type PickupPoint = z.infer<typeof pickupPointSchema>;

export const notifyAheadMinutesSchema = z
  .number()
  .int()
  .min(NOTIFY_AHEAD.MIN_MINUTES)
  .max(NOTIFY_AHEAD.MAX_MINUTES)
  .default(NOTIFY_AHEAD.DEFAULT_MINUTES);

export const createParcelInputSchema = z.object({
  senderName: z.string().trim().min(1).max(120),
  senderPhone: phoneSchema,
  receiverName: z.string().trim().min(1).max(120),
  receiverPhone: phoneSchema,
  description: z.string().trim().min(1).max(300),
  routeId: z.string().min(1),
  /** Optional. Without one, the route's final destination is used. */
  pickupPoint: pickupPointSchema.optional(),
  /** Minutes before arrival that the receiver wants to be alerted. */
  notifyAheadMinutes: notifyAheadMinutesSchema,
});
export type CreateParcelInput = z.infer<typeof createParcelInputSchema>;

export const locationPointSchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  /** Time the point was recorded on the device (ISO 8601). Late uploads keep their real time. */
  recordedAt: z.iso.datetime(),
  accuracyMeters: z.number().nonnegative().optional(),
});
export type LocationPoint = z.infer<typeof locationPointSchema>;

/** Driver app upload. The batchId makes retried uploads safe (idempotent). */
export const locationBatchSchema = z.object({
  batchId: z.string().min(8).max(64),
  points: z.array(locationPointSchema).min(1).max(500),
});
export type LocationBatch = z.infer<typeof locationBatchSchema>;

export const createTripInputSchema = z.object({
  driverId: z.string().min(1),
  routeId: z.string().min(1),
  vehicleLabel: z.string().trim().min(1).max(40),
  plannedDeparture: z.iso.datetime().optional(),
  parcelIds: z.array(z.string().min(1)).max(MAX_PARCELS_PER_TRIP).default([]),
});
export type CreateTripInput = z.infer<typeof createTripInputSchema>;

/** Start and Arrived include the time the button was pressed, so offline taps keep their real time. */
export const tripEventInputSchema = z.object({ occurredAt: z.iso.datetime().optional() });
export type TripEventInput = z.infer<typeof tripEventInputSchema>;
