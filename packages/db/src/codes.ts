import { createHash, randomBytes, randomInt } from "node:crypto";

// No 0, O, 1, I or L, so a code read out loud or copied from a slip is not mistaken.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

/** A short tracking code a cashier can read out or print on a slip, for example PT-K7M2X9. */
export function generateTrackingCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET.charAt(randomInt(CODE_ALPHABET.length));
  }
  return `PT-${code}`;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * A secret for the customer's tracking link. 32 random bytes (256 bits).
 * Put `token` in the link. Store only `tokenHash`, so a database leak does not expose working links.
 */
export function generateTrackingToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
