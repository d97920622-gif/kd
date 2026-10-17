// path: lib/encryption/root-key.ts
import { ENCRYPTION_CONFIG } from '../../config/encryption';

/**
 * Decoding of the root key text, shared by the environment schema and the key
 * vault, so both accept exactly the same values.
 *
 * The root key is 32 random bytes in canonical base64 (44 characters with one
 * padding character), for example the output of `openssl rand -base64 32`. A
 * passphrase is not accepted: a human passphrase needs a password KDF, and
 * MASTER_PROMPT's PBKDF2 or Argon2id rule is for passphrases. A random key
 * needs only HKDF, and HKDF is what the vault uses.
 *
 * This module never returns the text in an error and never logs it. A null
 * result tells the caller the text was refused, and nothing more.
 */

const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

/**
 * Decode the root key text. Returns the key bytes, or null when the text is
 * empty, not base64, not exactly 32 bytes, or not in canonical form.
 */
export function decodeRootKey(text: string): Buffer | null {
  if (text.length === 0 || !BASE64_PATTERN.test(text)) {
    return null;
  }
  const bytes = Buffer.from(text, 'base64');
  if (bytes.length !== ENCRYPTION_CONFIG.rootKeyBytes) {
    return null;
  }
  // Reject any text that does not re-encode to itself, so there is one spelling
  // of each key and a key cannot hide trailing bits.
  if (bytes.toString('base64') !== text) {
    return null;
  }
  return bytes;
}
