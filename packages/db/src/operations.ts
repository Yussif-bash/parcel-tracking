import type { ConfirmationSource, NotificationEvent } from "@parcel/shared";
import type { Db } from "./db.js";

/** True when DynamoDB rejected a write because its condition was not met. */
export function isConditionFailure(error: unknown): boolean {
  const e = error as { name?: string; cause?: { name?: string }; code?: number } | null;
  return (
    e?.name === "ConditionalCheckFailedException" ||
    e?.cause?.name === "ConditionalCheckFailedException" ||
    e?.name === "TransactionCanceledException"
  );
}

/**
 * Records that a notification is being sent. Returns true the first time, false if it was already recorded.
 * Call this before queueing the SMS, and only send when it returns true. This is the "never send twice" rule.
 */
export async function recordNotificationOnce(
  db: Db,
  input: { parcelId: string; event: NotificationEvent },
): Promise<boolean> {
  try {
    await db.notification.create(input).go();
    return true;
  } catch (error) {
    if (isConditionFailure(error)) return false;
    throw error;
  }
}

/**
 * Stores the newest known driver position on the trip. Returns false when the point is older than
 * (or equal to) the one already stored, or when the trip does not exist, so late uploads after an
 * offline period never move the map backwards.
 */
export async function updateLatestPosition(
  db: Db,
  input: { tripId: string; lat: number; lng: number; recordedAt: string },
): Promise<boolean> {
  const { tripId, lat, lng, recordedAt } = input;
  try {
    await db.trip
      .patch({ tripId })
      .set({ latestPosition: { lat, lng, recordedAt }, lastPingAt: recordedAt })
      .where(
        ({ lastPingAt }, { notExists, lt }) =>
          `${notExists(lastPingAt)} OR ${lt(lastPingAt, recordedAt)}`,
      )
      .go();
    return true;
  } catch (error) {
    if (isConditionFailure(error)) return false;
    throw error;
  }
}

/**
 * Marks a parcel as received. The first confirmation wins: returns false if it was already confirmed.
 * Note: this updates the parcel record only. The endpoint that calls it should also update the
 * matching trip-parcel record.
 */
export async function confirmReceipt(
  db: Db,
  input: {
    parcelId: string;
    source: ConfirmationSource;
    at?: string;
    position?: { lat: number; lng: number; recordedAt: string };
  },
): Promise<boolean> {
  const { parcelId, source, position } = input;
  const confirmedAt = input.at ?? new Date().toISOString();
  try {
    const patch = db.parcel
      .patch({ parcelId })
      .set({ status: "COLLECTED", confirmedBy: source, confirmedAt });
    if (position) patch.set({ confirmedPosition: position });
    await patch.where(({ confirmedAt: existing }, { notExists }) => notExists(existing)).go();
    return true;
  } catch (error) {
    if (isConditionFailure(error)) return false;
    throw error;
  }
}
