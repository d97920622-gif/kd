// path: lib/encryption/blind-index.ts
import { ENCRYPTION_CONFIG } from '../../config/encryption';
import { ValidationError } from '../errors/error-classes';

import type { KeyVault } from './key-vault';

/**
 * Blind indexes: a keyed token that lets the database find a row by an
 * encrypted field's value (for example, an email for an exact lookup) without
 * storing the value in clear and without a reversible form.
 *
 * A token is HMAC-SHA256 under the blind_index key of the value, normalised so
 * that "  Alice@Example.com " and "alice@example.com" give the same token. The
 * message also carries the company and the field name, so:
 *   - the same value in two companies gives two tokens (no cross-tenant join);
 *   - the same value in two fields gives two tokens (no cross-field join).
 *
 * The stored form is `v<version>:<64 hex>`. The version prefix lets a rotation
 * tell a token from an old key apart from one from the current key.
 *
 * A blind index is an equality oracle for anyone who can read it and guess
 * values. That is an accepted trade-off for lookup, and the reason the index
 * column is never returned to a client.
 */

const COMPANY_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FIELD_NAME_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const TOKEN_PATTERN = /^v([1-9][0-9]{0,5}):([0-9a-f]{64})$/;

export interface BlindIndexInput {
  /** The company the value belongs to. Lowercase UUID. */
  readonly companyId: string;
  /** The field the value came from, for example "email". Lowercase snake_case. */
  readonly field: string;
  /** The value to index. Normalised before hashing. */
  readonly value: string;
}

export interface ParsedBlindIndex {
  readonly keyVersion: number;
  readonly digest: string;
}

/**
 * Normalise a value for indexing: compatibility-fold, trim, collapse internal
 * whitespace, lowercase. The result is what is hashed, so the same person
 * typing the value differently still finds the same row.
 */
export function normaliseForIndex(value: string): string {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** The exact message that is MACed. Length-prefixed, so no two inputs share a message. */
function indexMessage(companyId: string, field: string, normalised: string): string {
  return `kd.blind-index.v1|${String(companyId.length)}:${companyId}|${String(field.length)}:${field}|${normalised}`;
}

/**
 * Compute the blind index token for a value under the active blind_index key.
 * Throws a ValidationError for a malformed company id or field, and for a value
 * that is empty after normalisation, because an empty index would match every
 * row that has no value.
 */
export function computeBlindIndex(vault: KeyVault, input: BlindIndexInput): string {
  if (!COMPANY_ID_PATTERN.test(input.companyId)) {
    throw new ValidationError({
      internalMessage: 'blind index company id is not a lowercase UUID',
    });
  }
  if (!FIELD_NAME_PATTERN.test(input.field)) {
    throw new ValidationError({
      internalMessage: 'blind index field name is not lowercase snake_case',
    });
  }
  const normalised = normaliseForIndex(input.value);
  if (normalised.length === 0) {
    throw new ValidationError({
      internalMessage: 'blind index value is empty after normalisation',
    });
  }
  if (Buffer.byteLength(normalised, 'utf8') > ENCRYPTION_CONFIG.maxPlaintextBytes) {
    throw new ValidationError({
      internalMessage: 'blind index value exceeds the field size limit',
    });
  }
  const keyVersion = vault.activeVersion('blind_index');
  const digest = vault.mac(
    'blind_index',
    keyVersion,
    indexMessage(input.companyId, input.field, normalised),
  );
  return `v${String(keyVersion)}:${digest}`;
}

/** Parse a stored token. Returns null for anything that is not a token. */
export function parseBlindIndex(text: string): ParsedBlindIndex | null {
  const match = TOKEN_PATTERN.exec(text);
  if (match === null || match[1] === undefined || match[2] === undefined) {
    return null;
  }
  return { keyVersion: Number(match[1]), digest: match[2] };
}
