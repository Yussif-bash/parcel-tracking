import { Entity } from "electrodb";
import type { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import {
  CONFIRMATION_SOURCES,
  NOTIFICATION_EVENTS,
  NOTIFY_AHEAD,
  PARCEL_STATUSES,
  TRACKING_MODES,
  TRIP_STATUSES,
  DELIVERY_STATUSES,
  TRIP_EVENT_SOURCES,
} from "@parcel/shared";

/**
 * Entity definitions for the single DynamoDB table (project document, section 8).
 *
 * Key rules used throughout:
 * - `template` writes keys exactly as the document describes, for example `TRIP#<id>` and `META`.
 * - `casing: "none"` keeps keys case-sensitive. ElectroDB lowercases keys by default.
 * - gsi1 and gsi2 are shared by several entities (each entity uses its own key prefix).
 *
 *   gsi1: trips by status, parcels by tracking code, lists of routes and drivers
 *   gsi2: trips by driver, parcels by tracking-token hash
 */

const now = () => new Date().toISOString();

const createdAt = { type: "string", required: true, readOnly: true, default: now } as const;
const updatedAt = { type: "string", watch: "*", set: now } as const;

const positionMap = {
  type: "map",
  properties: {
    lat: { type: "number", required: true },
    lng: { type: "number", required: true },
    recordedAt: { type: "string", required: true },
  },
} as const;

const pickupMap = {
  type: "map",
  properties: {
    lat: { type: "number", required: true },
    lng: { type: "number", required: true },
    label: { type: "string" },
  },
} as const;

const model = <E extends string>(entity: E) =>
  ({ entity, version: "1", service: "parcel" }) as const;

export const tripSchema = {
  model: model("trip"),
  attributes: {
    tripId: { type: "string", required: true },
    driverId: { type: "string", required: true },
    routeId: { type: "string", required: true },
    vehicleLabel: { type: "string", required: true },
    status: { type: TRIP_STATUSES, required: true, default: "PLANNED" },
    trackingMode: { type: TRACKING_MODES, required: true, default: "LIVE" },
    plannedDeparture: { type: "string" },
    startedAt: { type: "string" },
    startedBy: { type: TRIP_EVENT_SOURCES },
    endedAt: { type: "string" },
    endedBy: { type: TRIP_EVENT_SOURCES },
    /** Time of the newest accepted location point. Used by the watchdog and to reject stale points. */
    lastPingAt: { type: "string" },
    latestPosition: positionMap,
    createdAt,
    updatedAt,
  },
  indexes: {
    trip: {
      pk: { field: "pk", casing: "none", composite: ["tripId"], template: "TRIP#${tripId}" },
      sk: { field: "sk", casing: "none", composite: [], template: "META" },
    },
    byStatus: {
      index: "gsi1",
      pk: {
        field: "gsi1pk",
        casing: "none",
        composite: ["status"],
        template: "TRIPSTATUS#${status}",
      },
      sk: { field: "gsi1sk", casing: "none", composite: ["tripId"], template: "${tripId}" },
    },
    byDriver: {
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        casing: "none",
        composite: ["driverId"],
        template: "DRIVER#${driverId}",
      },
      sk: { field: "gsi2sk", casing: "none", composite: ["tripId"], template: "${tripId}" },
    },
  },
} as const;

/** A parcel as seen from its trip: what the Processor needs to decide when to alert the receiver. */
export const tripParcelSchema = {
  model: model("tripParcel"),
  attributes: {
    tripId: { type: "string", required: true },
    parcelId: { type: "string", required: true },
    receiverName: { type: "string", required: true },
    receiverPhone: { type: "string", required: true },
    pickupPoint: pickupMap,
    notifyAheadMinutes: { type: "number", required: true, default: NOTIFY_AHEAD.DEFAULT_MINUTES },
    status: { type: PARCEL_STATUSES, required: true, default: "ASSIGNED" },
    etaMinutes: { type: "number" },
    etaUpdatedAt: { type: "string" },
    /** Set when the near-pickup alert has been queued, so it is only sent once. */
    nearPickupAlertAt: { type: "string" },
    confirmedBy: { type: CONFIRMATION_SOURCES },
    confirmedAt: { type: "string" },
    createdAt,
    updatedAt,
  },
  indexes: {
    tripParcel: {
      pk: { field: "pk", casing: "none", composite: ["tripId"], template: "TRIP#${tripId}" },
      sk: { field: "sk", casing: "none", composite: ["parcelId"], template: "PARCEL#${parcelId}" },
    },
  },
} as const;

export const locationPointSchema = {
  model: model("locationPoint"),
  attributes: {
    tripId: { type: "string", required: true },
    /** ISO 8601 UTC time recorded on the device. Sorts correctly as text. */
    recordedAt: { type: "string", required: true },
    lat: { type: "number", required: true },
    lng: { type: "number", required: true },
    accuracyMeters: { type: "number" },
    batchId: { type: "string", required: true },
    /** Unix seconds. This is the table's TTL attribute, so DynamoDB deletes old points. */
    expiresAt: { type: "number", required: true },
  },
  indexes: {
    point: {
      pk: { field: "pk", casing: "none", composite: ["tripId"], template: "TRIP#${tripId}" },
      sk: { field: "sk", casing: "none", composite: ["recordedAt"], template: "LOC#${recordedAt}" },
    },
  },
} as const;

export const parcelSchema = {
  model: model("parcel"),
  attributes: {
    parcelId: { type: "string", required: true },
    trackingCode: { type: "string", required: true },
    senderName: { type: "string", required: true },
    senderPhone: { type: "string", required: true },
    receiverName: { type: "string", required: true },
    receiverPhone: { type: "string", required: true },
    description: { type: "string", required: true },
    routeId: { type: "string", required: true },
    pickupPoint: pickupMap,
    notifyAheadMinutes: { type: "number", required: true, default: NOTIFY_AHEAD.DEFAULT_MINUTES },
    status: { type: PARCEL_STATUSES, required: true, default: "REGISTERED" },
    tripId: { type: "string" },
    /** SHA-256 of the customer's tracking token. The token itself is never stored. */
    tokenHash: { type: "string", required: true },
    confirmedBy: { type: CONFIRMATION_SOURCES },
    confirmedAt: { type: "string" },
    /** Where the driver was when the handover was confirmed (when the driver confirms). */
    confirmedPosition: positionMap,
    createdAt,
    updatedAt,
  },
  indexes: {
    parcel: {
      pk: { field: "pk", casing: "none", composite: ["parcelId"], template: "PARCEL#${parcelId}" },
      sk: { field: "sk", casing: "none", composite: [], template: "META" },
    },
    byTrackingCode: {
      index: "gsi1",
      pk: {
        field: "gsi1pk",
        casing: "none",
        composite: ["trackingCode"],
        template: "CODE#${trackingCode}",
      },
      sk: { field: "gsi1sk", casing: "none", composite: [], template: "PARCEL" },
    },
    byToken: {
      index: "gsi2",
      pk: {
        field: "gsi2pk",
        casing: "none",
        composite: ["tokenHash"],
        template: "TOKEN#${tokenHash}",
      },
      sk: { field: "gsi2sk", casing: "none", composite: [], template: "PARCEL" },
    },
  },
} as const;

/** One record per parcel and event. Creating it with a condition makes "send once" a database guarantee. */
export const notificationSchema = {
  model: model("notification"),
  attributes: {
    parcelId: { type: "string", required: true },
    event: { type: NOTIFICATION_EVENTS, required: true },
    deliveryStatus: { type: DELIVERY_STATUSES, required: true, default: "QUEUED" },
    providerMessageId: { type: "string" },
    createdAt,
    updatedAt,
  },
  indexes: {
    notification: {
      pk: {
        field: "pk",
        casing: "none",
        composite: ["parcelId", "event"],
        template: "NOTIF#${parcelId}#${event}",
      },
      sk: { field: "sk", casing: "none", composite: [], template: "SENT" },
    },
  },
} as const;

const zoneMap = {
  type: "map",
  properties: {
    lat: { type: "number", required: true },
    lng: { type: "number", required: true },
    radiusMeters: { type: "number", required: true },
  },
} as const;

export const routeSchema = {
  model: model("route"),
  attributes: {
    routeId: { type: "string", required: true },
    name: { type: "string", required: true },
    destinationName: { type: "string", required: true },
    /** The arrival zone used for automatic arrival detection (centre point and radius). */
    destinationZone: zoneMap,
    /** The station zone used for automatic start detection. */
    stationZone: zoneMap,
    typicalDurationMinutes: { type: "number" },
    active: { type: "boolean", required: true, default: true },
    createdAt,
    updatedAt,
  },
  indexes: {
    route: {
      pk: { field: "pk", casing: "none", composite: ["routeId"], template: "ROUTE#${routeId}" },
      sk: { field: "sk", casing: "none", composite: [], template: "META" },
    },
    // Lets the cashier dashboard list all routes with one query.
    all: {
      index: "gsi1",
      pk: { field: "gsi1pk", casing: "none", composite: [], template: "ROUTE" },
      sk: { field: "gsi1sk", casing: "none", composite: ["routeId"], template: "${routeId}" },
    },
  },
} as const;

export const driverSchema = {
  model: model("driver"),
  attributes: {
    driverId: { type: "string", required: true },
    name: { type: "string", required: true },
    phone: { type: "string", required: true },
    vehicleLabel: { type: "string" },
    /** Links this driver to their Cognito login. */
    cognitoUsername: { type: "string" },
    active: { type: "boolean", required: true, default: true },
    createdAt,
    updatedAt,
  },
  indexes: {
    driver: {
      pk: { field: "pk", casing: "none", composite: ["driverId"], template: "DRIVER#${driverId}" },
      sk: { field: "sk", casing: "none", composite: [], template: "META" },
    },
    // Lets the cashier dashboard list all drivers with one query.
    all: {
      index: "gsi1",
      pk: { field: "gsi1pk", casing: "none", composite: [], template: "DRIVER" },
      sk: { field: "gsi1sk", casing: "none", composite: ["driverId"], template: "${driverId}" },
    },
  },
} as const;

export interface EntityConfig {
  table: string;
  client: DynamoDBDocumentClient;
}

export function createEntities(config: EntityConfig) {
  return {
    trip: new Entity(tripSchema, config),
    tripParcel: new Entity(tripParcelSchema, config),
    locationPoint: new Entity(locationPointSchema, config),
    parcel: new Entity(parcelSchema, config),
    notification: new Entity(notificationSchema, config),
    route: new Entity(routeSchema, config),
    driver: new Entity(driverSchema, config),
  };
}
