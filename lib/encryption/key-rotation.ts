// path: lib/encryption/key-rotation.ts
import { ENCRYPTION_CONFIG, type EncryptionPurpose } from '../../config/encryption';
import { ConfigurationError, InternalError } from '../errors/error-classes';

import type { KeyVault } from './key-vault';

/**
 * Key rotation, as pure functions. The database side (the activation function,
 * the ledger, the capture trigger) is in the 2.9 migration. The rotation driver
 * in scripts/encryption/rotation-rehearsal.ts uses these functions, and so does
 * any production job that re-encrypts stored values.
 *
 * Rotation makes a new key version active for a purpose. It never changes the
 * root key, so old envelopes still open: each envelope names the version it
 * was written under. A rotation is complete when no stored envelope still uses
 * a retired version, and a re-encryption job is how that is reached.
 *
 * The interval is config (90 days by default, MASTER_PROMPT layer 4). Annual
 * cadence (FEATURE_LIST item 3189) is supported by setting the interval to 365;
 * the bounds below allow it.
 */

export const MIN_ROTATION_INTERVAL_DAYS = 1;
export const MAX_ROTATION_INTERVAL_DAYS = 365;

const MILLISECONDS_PER_DAY = 86_400_000;

export interface ActiveKeyRecord {
  readonly purpose: EncryptionPurpose;
  readonly keyVersion: number;
  readonly activatedAt: Date;
}

export interface RotationStatus {
  readonly purpose: EncryptionPurpose;
  readonly keyVersion: number;
  readonly dueAt: Date;
  readonly due: boolean;
  /** Whole days until due. Negative when the rotation is overdue. */
  readonly daysRemaining: number;
}

function assertInterval(intervalDays: number): void {
  if (
    !Number.isSafeInteger(intervalDays) ||
    intervalDays < MIN_ROTATION_INTERVAL_DAYS ||
    intervalDays > MAX_ROTATION_INTERVAL_DAYS
  ) {
    throw new ConfigurationError({
      internalMessage: `rotation interval must be a whole number of days from ${String(MIN_ROTATION_INTERVAL_DAYS)} to ${String(MAX_ROTATION_INTERVAL_DAYS)}`,
    });
  }
}

/** The instant a key version's rotation falls due. */
export function rotationDueAt(activatedAt: Date, intervalDays: number): Date {
  assertInterval(intervalDays);
  if (Number.isNaN(activatedAt.getTime())) {
    throw new InternalError({ internalMessage: 'key activation time is not a valid date' });
  }
  return new Date(activatedAt.getTime() + intervalDays * MILLISECONDS_PER_DAY);
}

/**
 * Whether the active version of a purpose needs rotating at `now`. The due
 * instant is inclusive: at exactly the due time, the rotation is due.
 */
export function rotationStatus(
  record: ActiveKeyRecord,
  now: Date,
  intervalDays: number = ENCRYPTION_CONFIG.rotationIntervalDays,
): RotationStatus {
  const dueAt = rotationDueAt(record.activatedAt, intervalDays);
  const remainingMs = dueAt.getTime() - now.getTime();
  return {
    purpose: record.purpose,
    keyVersion: record.keyVersion,
    dueAt,
    due: remainingMs <= 0,
    daysRemaining: Math.floor(remainingMs / MILLISECONDS_PER_DAY),
  };
}

/**
 * Whether a stored envelope must be re-encrypted before the given version can
 * be retired: it is not the active version, or it is not an envelope at all.
 * A value that is not an envelope is reported as needing work, so it is found.
 */
export function needsReencryption(
  vault: KeyVault,
  envelope: string,
  purpose: EncryptionPurpose,
): boolean {
  const version = vault.keyVersionOf(envelope);
  return version === null || version !== vault.activeVersion(purpose);
}

export interface ReencryptResult {
  readonly envelope: string;
  readonly changed: boolean;
}

/**
 * Re-encrypt one stored value under the vault's active version. A value already
 * under the active version is returned unchanged, so a batch can be re-run.
 * The new envelope is opened again before it is returned; a value that does
 * not round-trip is refused, and the old envelope is kept.
 */
export function reencryptEnvelope(
  vault: KeyVault,
  envelope: string,
  purpose: EncryptionPurpose,
  context: string,
): ReencryptResult {
  if (!needsReencryption(vault, envelope, purpose)) {
    return { envelope, changed: false };
  }
  const plaintext = vault.decrypt(envelope, purpose, context);
  const next = vault.encrypt(purpose, plaintext, context);
  if (vault.decrypt(next, purpose, context) !== plaintext) {
    throw new InternalError({
      internalMessage: 're-encrypted value did not round-trip; kept the original',
    });
  }
  return { envelope: next, changed: true };
}

/**
 * Batch positions for a re-encryption run: a list of [offset, limit] pairs of
 * at most rotationBatchSize rows, covering `rowCount` rows exactly once.
 */
export function rotationBatches(rowCount: number): readonly (readonly [number, number])[] {
  if (!Number.isSafeInteger(rowCount) || rowCount < 0) {
    throw new InternalError({ internalMessage: 'row count for a rotation batch is not a count' });
  }
  const size = ENCRYPTION_CONFIG.rotationBatchSize;
  const batches: [number, number][] = [];
  for (let offset = 0; offset < rowCount; offset += size) {
    batches.push([offset, Math.min(size, rowCount - offset)]);
  }
  return batches;
}
