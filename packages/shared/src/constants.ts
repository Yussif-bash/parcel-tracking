/** Status values shared by the API, web app and driver app. Keep in sync with section 8.4 of the project document. */

export const TRIP_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const TRACKING_MODES = ["LIVE", "ESTIMATED", "MANUAL"] as const;
export type TrackingMode = (typeof TRACKING_MODES)[number];

export const PARCEL_STATUSES = [
  "REGISTERED",
  "ASSIGNED",
  "IN_TRANSIT",
  "NEAR_PICKUP",
  "ARRIVED",
  "COLLECTED",
  "CANCELLED",
] as const;
export type ParcelStatus = (typeof PARCEL_STATUSES)[number];

export const NOTIFICATION_EVENTS = [
  "REGISTERED",
  "TRIP_STARTED",
  "NEAR_PICKUP",
  "ARRIVED",
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

/** Who confirmed that a parcel was received (first confirmation wins). */
export const CONFIRMATION_SOURCES = ["CUSTOMER", "DRIVER", "CASHIER"] as const;
export type ConfirmationSource = (typeof CONFIRMATION_SOURCES)[number];

/** Alert lead time, chosen per parcel at registration. */
export const NOTIFY_AHEAD = { DEFAULT_MINUTES: 30, MIN_MINUTES: 5, MAX_MINUTES: 180 } as const;

/** A trip with no location ping for this long is flagged and moved to ESTIMATED mode. */
export const STALE_TRIP_MINUTES = 5;

/** Maximum parcels expected on one trip. */
export const MAX_PARCELS_PER_TRIP = 20;
