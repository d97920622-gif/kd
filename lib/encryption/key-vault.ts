// path: lib/encryption/key-vault.ts
import { createHmac, hkdfSync } from 'node:crypto';

import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_PURPOSES,
  type EncryptionPurpose,
} from '../../config/encryption';
import { ConfigurationError, InternalError, ValidationError } from '../errors/error-classes';
import { registerSecretValue } from '../logger/redaction';

import {
  buildAssociatedData,
  formatEnvelope,
  openAes256Gcm,
  parseEnvelope,
  sealAes256Gcm,
} from './aes-256-gcm';
import { decodeRootKey } from './root-key';

/**
 * The key vault. It is the one place a key is derived, and the one place a
 * field is encrypted or decrypted. Every consumer calls it; no consumer holds
 * key bytes (ownership matrix: encryption is one module, no local crypto).
 *
 * Derivation. Each (purpose, version) key is HKDF-SHA256 of the root key, with
 * the fixed salt from config and an info string that names the purpose and
 * version. Different purposes and versions therefore get independent keys, and
 * the root key is never used directly to encrypt.
 *
 * Versions. A write always uses the active version for its purpose. A read uses
 * the version named in the envelope, so a value written before a rotation still
 * opens after it. The vault derives any version it is asked for; which versions
 * are retained is a database decision recorded in encryption_key_versions.
 *
 * Errors carry no key material and no plaintext. A failed decryption is an
 * InternalError whose message is never exposed, because it is a defect or an
 * attack, not something the caller can fix.
 */

/** True when a value names one of the configured purposes. */
export function isEncryptionPurpose(value: string): value is EncryptionPurpose {
  return (ENCRYPTION_PURPOSES as readonly string[]).includes(value);
}

/** The active version of each purpose. */
export type ActiveVersions = Readonly<Record<EncryptionPurpose, number>>;

export interface KeyVault {
  /** The version new writes for this purpose use. */
  activeVersion(purpose: EncryptionPurpose): number;
  /** Encrypt text under the active version and return the stored envelope. */
  encrypt(purpose: EncryptionPurpose, plaintext: string, context: string): string;
  /** Decrypt an envelope, checking it names the expected purpose. */
  decrypt(envelope: string, purpose: EncryptionPurpose, context: string): string;
  /** The key version named by an envelope, or null if the text is not one. */
  keyVersionOf(envelope: string): number | null;
  /** The key check for a version: a MAC of a fixed label, recorded in the database. */
  keyCheck(purpose: EncryptionPurpose, keyVersion: number): string;
  /**
   * HMAC-SHA256 in lowercase hex, for the blind index only. It is refused for
   * every other purpose, so a field key can never be used as a MAC oracle.
   */
  mac(purpose: EncryptionPurpose, keyVersion: number, message: string): string;
}

export interface KeyVaultOptions {
  readonly rootKey: Buffer;
  readonly activeVersions: ActiveVersions;
}

function assertVersion(keyVersion: number): void {
  if (
    !Number.isSafeInteger(keyVersion) ||
    keyVersion < 1 ||
    keyVersion > ENCRYPTION_CONFIG.maxKeyVersion
  ) {
    throw new InternalError({
      internalMessage: `key version ${String(keyVersion)} is outside 1 to ${String(ENCRYPTION_CONFIG.maxKeyVersion)}`,
    });
  }
}

function assertContext(context: string): void {
  if (context.length === 0 || context.length > ENCRYPTION_CONFIG.maxContextLength) {
    throw new InternalError({
      internalMessage: `encryption context must be 1 to ${String(ENCRYPTION_CONFIG.maxContextLength)} characters`,
    });
  }
}

function deriveKey(rootKey: Buffer, purpose: EncryptionPurpose, keyVersion: number): Buffer {
  const salt = Buffer.from(ENCRYPTION_CONFIG.derivationSalt, 'utf8');
  const info = Buffer.from(`purpose=${purpose};version=${String(keyVersion)}`, 'utf8');
  return Buffer.from(hkdfSync('sha256', rootKey, salt, info, ENCRYPTION_CONFIG.rootKeyBytes));
}

/** Build a vault from raw root key bytes. Used by the loader and by the rehearsal. */
export function createKeyVault(options: KeyVaultOptions): KeyVault {
  if (options.rootKey.length !== ENCRYPTION_CONFIG.rootKeyBytes) {
    throw new ConfigurationError({
      internalMessage: `root key has ${String(options.rootKey.length)} bytes, expected ${String(ENCRYPTION_CONFIG.rootKeyBytes)}`,
    });
  }
  for (const purpose of ENCRYPTION_PURPOSES) {
    const version = options.activeVersions[purpose];
    if (
      !Number.isSafeInteger(version) ||
      version < 1 ||
      version > ENCRYPTION_CONFIG.maxKeyVersion
    ) {
      throw new ConfigurationError({
        internalMessage: `the active version for ${purpose} is not a valid key version`,
      });
    }
  }

  const rootKey = Buffer.from(options.rootKey);
  const activeVersions = { ...options.activeVersions };
  const cache = new Map<string, Buffer>();

  const keyFor = (purpose: EncryptionPurpose, keyVersion: number): Buffer => {
    assertVersion(keyVersion);
    const id = `${purpose}:${String(keyVersion)}`;
    const cached = cache.get(id);
    if (cached !== undefined) {
      return cached;
    }
    const derived = deriveKey(rootKey, purpose, keyVersion);
    cache.set(id, derived);
    return derived;
  };

  return {
    activeVersion(purpose) {
      return activeVersions[purpose];
    },

    encrypt(purpose, plaintext, context) {
      assertContext(context);
      const bytes = Buffer.from(plaintext, 'utf8');
      if (bytes.length > ENCRYPTION_CONFIG.maxPlaintextBytes) {
        throw new ValidationError({
          internalMessage: `plaintext is ${String(bytes.length)} bytes, above the ${String(ENCRYPTION_CONFIG.maxPlaintextBytes)} byte field limit`,
        });
      }
      const keyVersion = activeVersions[purpose];
      const sealed = sealAes256Gcm(
        keyFor(purpose, keyVersion),
        bytes,
        buildAssociatedData(purpose, keyVersion, context),
      );
      return formatEnvelope({ purpose, keyVersion, ...sealed });
    },

    decrypt(envelope, purpose, context) {
      assertContext(context);
      const fields = parseEnvelope(envelope);
      if (fields === null) {
        throw new InternalError({
          internalMessage: 'stored value is not a canonical encryption envelope',
        });
      }
      if (fields.purpose !== purpose) {
        throw new InternalError({
          internalMessage: 'envelope purpose does not match the purpose the caller expects',
        });
      }
      const plaintext = openAes256Gcm(
        keyFor(fields.purpose, fields.keyVersion),
        { iv: fields.iv, tag: fields.tag, ciphertext: fields.ciphertext },
        buildAssociatedData(fields.purpose, fields.keyVersion, context),
      );
      return plaintext.toString('utf8');
    },

    keyVersionOf(envelope) {
      const fields = parseEnvelope(envelope);
      return fields === null ? null : fields.keyVersion;
    },

    keyCheck(purpose, keyVersion) {
      return createHmac('sha256', keyFor(purpose, keyVersion))
        .update(ENCRYPTION_CONFIG.keyCheckLabel, 'utf8')
        .digest('hex');
    },

    mac(purpose, keyVersion, message) {
      if (purpose !== 'blind_index') {
        throw new InternalError({
          internalMessage: 'mac is available for the blind index purpose only',
        });
      }
      return createHmac('sha256', keyFor(purpose, keyVersion))
        .update(message, 'utf8')
        .digest('hex');
    },
  };
}

/**
 * Build the vault from the root key text. The text is validated, and it is
 * registered with the log redaction module, so a stray copy of it in a log
 * line is masked. A missing or malformed key is a configuration error.
 */
export function loadKeyVault(
  rootKeyText: string | undefined,
  activeVersions: ActiveVersions = ENCRYPTION_CONFIG.activeVersions,
): KeyVault {
  const name = ENCRYPTION_CONFIG.rootKeyEnvName;
  if (rootKeyText === undefined || rootKeyText.length === 0) {
    throw new ConfigurationError({ internalMessage: `${name} is not set` });
  }
  const rootKey = decodeRootKey(rootKeyText);
  if (rootKey === null) {
    throw new ConfigurationError({
      internalMessage: `${name} is not 32 random bytes in canonical base64`,
    });
  }
  registerSecretValue(rootKeyText);
  return createKeyVault({ rootKey, activeVersions });
}
