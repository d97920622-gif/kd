// path: lib/encryption/aes-256-gcm.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_PURPOSES,
  type EncryptionPurpose,
} from '../../config/encryption';
import { InternalError } from '../errors/error-classes';

/**
 * AES-256-GCM, the one cipher the platform uses for stored secrets (MASTER_PROMPT
 * layer 4). Every other module encrypts through the key vault, which calls this
 * file. Writing a cipher anywhere else is refused by check:encryption.
 *
 * Two layers live here:
 *   1. sealAes256Gcm and openAes256Gcm: the raw cipher. A fresh random 96-bit
 *      nonce per seal, a 128-bit tag, and associated data that is authenticated
 *      but not encrypted.
 *   2. The envelope: the text form in which an encrypted value is stored. It
 *      names its purpose and key version, so a value can be decrypted after a
 *      rotation and an operator can see which version protects it.
 *
 *   kdenc.v1.<purpose>.<keyVersion>.<iv>.<tag>.<ciphertext>
 *
 * The iv, tag and ciphertext are base64url without padding. The associated
 * data binds the header and the caller's context, so a ciphertext cannot be
 * moved to another row, column or version and still open.
 */

const PREFIX = ENCRYPTION_CONFIG.envelopePrefix;
const FORMAT = ENCRYPTION_CONFIG.envelopeFormat;
const KEY_BYTES = ENCRYPTION_CONFIG.rootKeyBytes;
const IV_BYTES = ENCRYPTION_CONFIG.ivBytes;
const TAG_BYTES = ENCRYPTION_CONFIG.tagBytes;

const IV_TEXT_LENGTH = Math.ceil((IV_BYTES * 4) / 3);
const TAG_TEXT_LENGTH = Math.ceil((TAG_BYTES * 4) / 3);
const PURPOSES: ReadonlySet<string> = new Set<string>(ENCRYPTION_PURPOSES);

const ENVELOPE_PATTERN = new RegExp(
  `^${PREFIX}\\.${FORMAT}\\.([a-z_]{1,32})\\.([1-9][0-9]{0,5})\\.([A-Za-z0-9_-]{${IV_TEXT_LENGTH}})\\.([A-Za-z0-9_-]{${TAG_TEXT_LENGTH}})\\.([A-Za-z0-9_-]*)$`,
);

export interface GcmSealed {
  readonly iv: Buffer;
  readonly tag: Buffer;
  readonly ciphertext: Buffer;
}

export interface EnvelopeFields {
  readonly purpose: EncryptionPurpose;
  readonly keyVersion: number;
  readonly iv: Buffer;
  readonly tag: Buffer;
  readonly ciphertext: Buffer;
}

function requireKey(key: Buffer): void {
  if (key.length !== KEY_BYTES) {
    throw new InternalError({
      internalMessage: `encryption key has ${String(key.length)} bytes, expected ${String(KEY_BYTES)}`,
    });
  }
}

/**
 * Encrypt with a fresh random nonce. The associated data is authenticated but
 * not stored, so the caller must supply the same bytes to open the value.
 */
export function sealAes256Gcm(key: Buffer, plaintext: Buffer, associatedData: Buffer): GcmSealed {
  requireKey(key);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ENCRYPTION_CONFIG.cipher, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(associatedData);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return { iv, tag: cipher.getAuthTag(), ciphertext };
}

/**
 * Decrypt and authenticate. A wrong key, a changed ciphertext, a changed tag or
 * different associated data all fail the same way, with no detail that could
 * help an attacker tell them apart.
 */
export function openAes256Gcm(key: Buffer, sealed: GcmSealed, associatedData: Buffer): Buffer {
  requireKey(key);
  if (sealed.iv.length !== IV_BYTES || sealed.tag.length !== TAG_BYTES) {
    throw new InternalError({ internalMessage: 'encrypted value has a malformed nonce or tag' });
  }
  const decipher = createDecipheriv(ENCRYPTION_CONFIG.cipher, key, sealed.iv, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAAD(associatedData);
  decipher.setAuthTag(sealed.tag);
  try {
    return Buffer.concat([decipher.update(sealed.ciphertext), decipher.final()]);
  } catch {
    throw new InternalError({
      internalMessage: 'encrypted value failed authentication: wrong key, context or altered value',
    });
  }
}

/**
 * The associated data for an envelope: the header fields and the caller's
 * context. The caller must pass the same context to open a value.
 */
export function buildAssociatedData(
  purpose: EncryptionPurpose,
  keyVersion: number,
  context: string,
): Buffer {
  return Buffer.from(`${PREFIX}.${FORMAT}|${purpose}|${String(keyVersion)}|${context}`, 'utf8');
}

/** Format an envelope as its stored text. */
export function formatEnvelope(fields: EnvelopeFields): string {
  return [
    PREFIX,
    FORMAT,
    fields.purpose,
    String(fields.keyVersion),
    fields.iv.toString('base64url'),
    fields.tag.toString('base64url'),
    fields.ciphertext.toString('base64url'),
  ].join('.');
}

/**
 * Parse a stored envelope. Returns null for any text that is not a canonical
 * envelope, so a malformed value is refused rather than guessed at. Canonical
 * means the base64url segments re-encode to themselves.
 */
export function parseEnvelope(text: string): EnvelopeFields | null {
  const match = ENVELOPE_PATTERN.exec(text);
  if (match === null) {
    return null;
  }
  const [, purposeText, versionText, ivText, tagText, ciphertextText] = match;
  if (purposeText === undefined || versionText === undefined) {
    return null;
  }
  const iv = Buffer.from(ivText ?? '', 'base64url');
  const tag = Buffer.from(tagText ?? '', 'base64url');
  const ciphertext = Buffer.from(ciphertextText ?? '', 'base64url');
  if (
    iv.length !== IV_BYTES ||
    tag.length !== TAG_BYTES ||
    iv.toString('base64url') !== ivText ||
    tag.toString('base64url') !== tagText ||
    ciphertext.toString('base64url') !== (ciphertextText ?? '')
  ) {
    return null;
  }
  if (!PURPOSES.has(purposeText)) {
    return null;
  }
  return {
    purpose: purposeText as EncryptionPurpose,
    keyVersion: Number(versionText),
    iv,
    tag,
    ciphertext,
  };
}
