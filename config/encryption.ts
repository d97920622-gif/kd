// path: config/encryption.ts
/**
 * Encryption contract values (sub-step 2.9). Every number and label the
 * encryption core uses is here, so no module carries its own constant.
 *
 * Key hierarchy:
 *   ENCRYPTION_KEY (environment, 32 random bytes) is the root. It never
 *   rotates (MASTER_PROMPT layer 4, FEATURE_LIST item 3188). Every other key is
 *   derived from it with HKDF-SHA256, one key per purpose and version. A new
 *   version is a new derivation, so the root is untouched by a rotation.
 *
 * Rotation interval. MASTER_PROMPT layer 4 requires secondary keys to rotate
 * every 90 days. FEATURE_LIST item 3189 asks for annual rotation to be
 * supported. The value below is the stricter 90 days; a deployment that wants
 * an annual cadence sets a different value after review, and the check that
 * reads this value is the same in both cases.
 */

export const ENCRYPTION_PURPOSES = ['field', 'blind_index'] as const;

export type EncryptionPurpose = (typeof ENCRYPTION_PURPOSES)[number];

export const ENCRYPTION_CONFIG = {
  /** Name of the environment variable that holds the root key. */
  rootKeyEnvName: 'ENCRYPTION_KEY',
  /** Length of the root key in bytes. AES-256 and HKDF output both use 32. */
  rootKeyBytes: 32,
  /** HKDF salt. A fixed label, versioned so a future change cannot collide. */
  derivationSalt: 'kd.encryption.v1',
  /** Label for the key check, a MAC of this text under each derived key. */
  keyCheckLabel: 'kd.encryption.key-check.v1',
  /** Envelope prefix and format version, so a stored value names its scheme. */
  envelopePrefix: 'kdenc',
  envelopeFormat: 'v1',
  /** Cipher and its fixed sizes. GCM takes a 96-bit nonce and a 128-bit tag. */
  cipher: 'aes-256-gcm',
  ivBytes: 12,
  tagBytes: 16,
  /** Largest plaintext a single field may hold, in bytes. */
  maxPlaintextBytes: 1048576,
  /** Largest associated-data context a caller may bind, in characters. */
  maxContextLength: 256,
  /**
   * The version each purpose uses for new writes. This is the deploy-time
   * setting. The table encryption_key_versions records the same facts, and
   * npm run encryption:ledger:check refuses a deploy where they disagree.
   */
  activeVersions: { field: 1, blind_index: 1 } satisfies Record<EncryptionPurpose, number>,
  /** Largest key version number. Matches the range check in the 2.9 migration. */
  maxKeyVersion: 100000,
  /** Days a key version may stay active before rotation is due. */
  rotationIntervalDays: 90,
  /** Largest number of records one rotation batch handles in memory. */
  rotationBatchSize: 500,
} as const;
