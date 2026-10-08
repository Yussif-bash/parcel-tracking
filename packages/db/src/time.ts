const SECONDS_PER_DAY = 24 * 60 * 60;

/**
 * The value for a DynamoDB TTL attribute: a Unix timestamp in whole seconds.
 * DynamoDB deletes the item some time after this moment (often within a few days), so code that
 * reads location points should also ignore points past their expiry.
 */
export function ttlEpochSeconds(days: number, now: number = Date.now()): number {
  return Math.floor(now / 1000) + Math.round(days * SECONDS_PER_DAY);
}

/** Default retention for GPS points. To be confirmed with the station (see open questions). */
export const LOCATION_RETENTION_DAYS = 30;
