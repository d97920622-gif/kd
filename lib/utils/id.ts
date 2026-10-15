// path: lib/utils/id.ts
/**
 * Identifier helpers.
 *
 * Primary key format is UUID version 7 (RFC 9562): time ordered, so index
 * locality matches insert order and the database can sort by id. The
 * implementation keeps a monotonic counter for ids generated inside the same
 * millisecond; a burst of inserts therefore still produces strictly
 * increasing values, and no two ids can be equal.
 *
 * Also provided: prefixed resource ids for logs and UI (inv_... style),
 * short human references that are explicitly NOT unique enough for storage,
 * and validators for both id shapes.
 *
 * Randomness uses the Web Crypto global, which exists in Node 20+ and in
 * every browser, so this module works on the server and in a client
 * component. It is not a random-number generator for secrets: keys come from
 * lib/utils/hash.ts randomBytesHex.
 */

/** The zero UUID, rejected everywhere as a real identifier. */
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/** Prefixes reserved for resource identifiers. */
export const ID_PREFIXES = {
  company: 'cmp',
  user: 'usr',
  invoice: 'inv',
  estimate: 'est',
  client: 'cli',
  payment: 'pay',
  payout: 'pot',
  refund: 'ref',
  dispute: 'dsp',
  subscription: 'sub',
  product: 'prd',
  expense: 'exp',
  payrollRun: 'prr',
  journalEntry: 'jrn',
  approvalRequest: 'apr',
  auditLog: 'aud',
  file: 'fil',
  webhookEvent: 'whk',
  jobRun: 'job',
} as const;

export type IdPrefixKey = keyof typeof ID_PREFIXES;

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const PREFIXED_ID_PATTERN =
  /^[a-z]{2,4}_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const VERSION_BITS_V7 = 0x70;
const VARIANT_BITS_RFC = 0x80;

let lastTimestampMs = -1;
let sameMillisecondCounter = 0;

function cryptoSource(): Crypto {
  const candidate = globalThis.crypto;
  if (candidate === undefined || typeof candidate.getRandomValues !== 'function') {
    throw new Error('A cryptographic random source is required to generate identifiers.');
  }
  return candidate;
}

function randomBytesArray(byteLength: number): Uint8Array {
  const buffer = new Uint8Array(byteLength);
  cryptoSource().getRandomValues(buffer);
  return buffer;
}

function toHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function formatUuid(bytes: Uint8Array): string {
  const hex = toHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate a time-ordered UUID version 7.
 *
 * Layout: 48 bit Unix time in milliseconds, 4 bit version, 12 bit monotonic
 * counter, 2 bit RFC variant, 62 random bits. Inside one millisecond the
 * counter increments, so ids stay strictly increasing without waiting.
 */
export function newId(): string {
  const timestampMs = Date.now();
  if (timestampMs === lastTimestampMs) {
    if (sameMillisecondCounter >= 0xfff) {
      lastTimestampMs = timestampMs + 1;
      sameMillisecondCounter = 0;
    } else {
      sameMillisecondCounter += 1;
    }
  } else {
    lastTimestampMs = Math.max(timestampMs, lastTimestampMs + 1);
    sameMillisecondCounter = 0;
  }
  const bytes = randomBytesArray(16);
  const counter = sameMillisecondCounter;
  bytes[0] = Math.floor(lastTimestampMs / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(lastTimestampMs / 2 ** 32) & 0xff;
  bytes[2] = Math.floor(lastTimestampMs / 2 ** 24) & 0xff;
  bytes[3] = Math.floor(lastTimestampMs / 2 ** 16) & 0xff;
  bytes[4] = Math.floor(lastTimestampMs / 2 ** 8) & 0xff;
  bytes[5] = lastTimestampMs & 0xff;
  bytes[6] = VERSION_BITS_V7 | ((counter >> 8) & 0x0f);
  bytes[7] = counter & 0xff;
  bytes[8] = VARIANT_BITS_RFC | (bytes[8] & 0x3f);
  return formatUuid(bytes);
}

/** Milliseconds encoded in a UUID version 7, or null for another shape. */
export function timestampFromId(id: string): number | null {
  if (!UUID_V7_PATTERN.test(id)) {
    return null;
  }
  const hex = id.replace(/-/g, '');
  return Number.parseInt(hex.slice(0, 12), 16);
}

/** Instant encoded in a UUID version 7, or null for another shape. */
export function dateFromId(id: string): Date | null {
  const ms = timestampFromId(id);
  return ms === null ? null : new Date(ms);
}

/** Prefixed resource id for logs and UI: inv_<uuid v7>. */
export function newPrefixedId(key: IdPrefixKey): string {
  return `${ID_PREFIXES[key]}_${newId()}`;
}

/** True when the value is a UUID version 7. */
export function isUuidV7(value: unknown): value is string {
  return typeof value === 'string' && UUID_V7_PATTERN.test(value);
}

/** True when the value is any UUID shape: nil is rejected. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value) && value !== NIL_UUID;
}

/** True when the value is a prefixed resource id: cmp_<uuid>. */
export function isPrefixedId(value: unknown): value is string {
  return typeof value === 'string' && PREFIXED_ID_PATTERN.test(value);
}

/** Split a prefixed id into its prefix and its UUID, or null when malformed. */
export function splitPrefixedId(value: string): { prefix: string; id: string } | null {
  if (!isPrefixedId(value)) {
    return null;
  }
  const separator = value.indexOf('_');
  return { prefix: value.slice(0, separator), id: value.slice(separator + 1) };
}

/**
 * Reference alphabet: digits and letters with the four characters that are
 * easily misread removed (I, L, O and U). Thirty-two symbols exactly, which
 * divides 256 evenly, so mapping a random byte to a character introduces no
 * modulo bias.
 */
const SHORT_REFERENCE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

const SHORT_REFERENCE_BODY_PATTERN = '[0-9A-HJKMNP-TV-Z]';

/**
 * Short human-readable reference such as INV-7Q2M4X8B, built from the
 * misread-safe alphabet above so it can be read aloud or typed without
 * ambiguity.
 *
 * This is a display reference, never a primary key: uniqueness is not
 * guaranteed by construction and a caller must persist and check it.
 */
export function newShortReference(prefix = 'REF', length = 8): string {
  if (!/^[A-Z]{2,6}$/.test(prefix)) {
    throw new RangeError('A short reference prefix must be two to six upper case letters.');
  }
  if (!Number.isInteger(length) || length < 6 || length > 16) {
    throw new RangeError('A short reference body must be six to sixteen characters.');
  }
  const bytes = randomBytesArray(length);
  const alphabetLength = SHORT_REFERENCE_ALPHABET.length;
  let body = '';
  for (const byte of bytes) {
    body += SHORT_REFERENCE_ALPHABET[byte % alphabetLength];
  }
  return `${prefix}-${body}`;
}

/** True when the value matches the short reference shape. */
export function isShortReference(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    new RegExp(`^[A-Z]{2,6}-${SHORT_REFERENCE_BODY_PATTERN}{6,16}$`).test(value)
  );
}

/** Idempotency key in UUID version 7 form, for payment requests. */
export function newIdempotencyKey(): string {
  return newId();
}

/** True when the value is usable as an idempotency key. */
export function isIdempotencyKey(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 16 &&
    value.length <= 128 &&
    /^[A-Za-z0-9._:-]+$/.test(value)
  );
}
