import { randomBytes } from "node:crypto";

// Crockford base32: no I, L, O or U, so IDs are easy to read out loud.
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A time-ordered unique ID (ULID format, 26 characters).
 * The first 10 characters are the creation time, so IDs sort by creation time.
 * The last 16 characters are random, so two IDs made in the same millisecond still differ.
 */
export function newId(now: number = Date.now()): string {
  let time = "";
  let remaining = now;
  for (let i = 0; i < 10; i++) {
    time = ENCODING.charAt(remaining % 32) + time;
    remaining = Math.floor(remaining / 32);
  }

  let random = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of randomBytes(10)) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      random += ENCODING.charAt((buffer >>> (bits - 5)) & 31);
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  return time + random;
}
