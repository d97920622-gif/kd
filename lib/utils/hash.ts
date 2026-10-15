// path: lib/utils/hash.ts
/**
 * Hashing and signing helpers built on node:crypto.
 *
 * Used for: content hashes for duplicate detection, HMAC signatures for
 * tokenised client links and webhook verification, blind indexes for
 * encrypted lookups, and constant-time comparison of secrets.
 *
 * Rules:
 *   - SHA-256 and HMAC-SHA-256 only. No MD5, no SHA-1, no custom crypto.
 *   - Signing keys are never logged, never returned and never compared with
 *     the equality operator; timingSafeEqualHex is the single comparison
 *     helper for secret material.
 *   - Input is normalized (NFC) before hashing when it is user text, so the
 *     same visible characters always produce the same hash.
 *
 * Server side only: node:crypto is not available in the browser. A client
 * that needs a hash calls a server route; it never re-implements this.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type HashInput = string | Uint8Array;

/**
 * Shortest inputs accepted by the digest helpers. Zero-length input is
 * rejected so an empty string can never silently produce the well-known hash
 * of the empty message.
 */
const MIN_INPUT_LENGTH = 1;

/** Length of a SHA-256 digest in bytes. */
export const SHA256_BYTES = 32;

/** Length of a SHA-256 digest in hex characters. */
export const SHA256_HEX_LENGTH = 64;

/**
 * Compare a HashInput against the minimum length rule. Accepts an empty
 * Uint8Array only when a length is explicitly allowed by the caller.
 */
function ensureInput(input: HashInput): HashInput {
  if (typeof input === 'string') {
    if (input.length < MIN_INPUT_LENGTH) {
      throw new RangeError('Hashing requires a non-empty input.');
    }
    return input;
  }
  if (input.length < MIN_INPUT_LENGTH) {
    throw new RangeError('Hashing requires a non-empty input.');
  }
  return input;
}

/** SHA-256 digest as lower case hex. */
export function sha256Hex(input: HashInput): string {
  return createHash('sha256').update(ensureInput(input)).digest('hex');
}

/** SHA-256 digest as base64url text, suitable for a URL segment. */
export function sha256Base64Url(input: HashInput): string {
  return createHash('sha256').update(ensureInput(input)).digest('base64url');
}

/** SHA-256 digest as raw bytes. */
export function sha256Bytes(input: HashInput): Buffer {
  return createHash('sha256').update(ensureInput(input)).digest();
}

/** HMAC-SHA-256 signature as lower case hex. */
export function hmacSha256Hex(key: HashInput, message: HashInput): string {
  return createHmac('sha256', key).update(ensureInput(message)).digest('hex');
}

/** HMAC-SHA-256 signature as base64url text. */
export function hmacSha256Base64Url(key: HashInput, message: HashInput): string {
  return createHmac('sha256', key).update(ensureInput(message)).digest('base64url');
}

/** HMAC-SHA-256 signature as raw bytes. */
export function hmacSha256Bytes(key: HashInput, message: HashInput): Buffer {
  return createHmac('sha256', key).update(ensureInput(message)).digest();
}

/**
 * Constant-time comparison of two hex digests. Returns false for malformed
 * input instead of throwing, so a verification path cannot leak a difference
 * through an exception.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (
    !/^[0-9a-f]*$/i.test(a) ||
    !/^[0-9a-f]*$/i.test(b) ||
    a.length !== b.length ||
    a.length === 0
  ) {
    return false;
  }
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/** Constant-time comparison of two arbitrary strings using their UTF-8 bytes. */
export function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length === 0 || left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

/** Verify an HMAC-SHA-256 signature in constant time. */
export function verifyHmacSha256(
  key: HashInput,
  message: HashInput,
  signatureHex: string,
): boolean {
  return timingSafeEqualHex(hmacSha256Hex(key, message), signatureHex);
}

/** Cryptographically random bytes, used for keys, salts and nonces. */
export function randomBytesHex(byteLength = 32): string {
  if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 64) {
    throw new RangeError('Random byte length must be an integer between 16 and 64.');
  }
  return randomBytes(byteLength).toString('hex');
}

/**
 * Normalize user text before hashing: NFC form, trimmed, internal whitespace
 * collapsed and lower cased. Two visually identical values then hash to the
 * same digest regardless of how they were typed.
 */
export function normalizeForHash(value: string): string {
  return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Stable hash of a list of parts, for duplicate detection. Parts are joined
 * with a separator that cannot appear inside a normalized part, so
 * ('ab', 'c') and ('a', 'bc') produce different digests.
 */
export function contentHash(parts: readonly (string | number | null | undefined)[]): string {
  const normalized = parts
    .filter((part): part is string | number => part !== null && part !== undefined)
    .map((part) => (typeof part === 'number' ? String(part) : normalizeForHash(part)));
  return sha256Hex(normalized.join('\u0001'));
}

/** Short digest for human-facing references; not for security decisions. */
export function shortHash(input: HashInput, length = 12): string {
  if (!Number.isInteger(length) || length < 6 || length > SHA256_HEX_LENGTH) {
    throw new RangeError(`Short hash length must be between 6 and ${SHA256_HEX_LENGTH}.`);
  }
  return sha256Hex(input).slice(0, length);
}

/**
 * Keyed blind index for a value that is stored encrypted: the same plaintext
 * and key always produce the same index, so equality can be queried without
 * decrypting the row.
 */
export function blindIndex(key: HashInput, value: string): string {
  return hmacSha256Hex(key, normalizeForHash(value));
}

/** True when the value looks like a SHA-256 hex digest. */
export function isSha256Hex(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length === SHA256_HEX_LENGTH && /^[0-9a-f]+$/.test(value)
  );
}
