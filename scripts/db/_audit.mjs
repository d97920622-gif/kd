// path: scripts/db/_audit.mjs
/**
 * The rules that the audit signing runner and its verifier share (sub-step 2.8).
 *
 * Both sides must sign and check the same bytes, so the payloads are built here
 * and nowhere else:
 *
 *   a ledger row  the UTF-8 bytes of its current_hash (64 hex characters)
 *   a Merkle root the UTF-8 bytes of "first:last:root_hash"
 *
 * The signature is Ed25519, base64 encoded, 64 bytes. The database stores it as
 * text and checks its shape (chk_audit_logs_signature_format).
 */

export const PRIVATE_KEY_ENVIRONMENT = 'AUDIT_SIGNING_PRIVATE_KEY';
export const KEY_ID_ENVIRONMENT = 'AUDIT_SIGNING_KEY_ID';
export const SIGNING_KEY_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{2,63}$/;

/** Rows per round trip. Small enough that a batch fits in memory and in one query. */
export const BATCH_SIZE = 500;

/**
 * The bytes a Merkle root signature covers. The sequence range is part of the
 * payload, so a signed root cannot be replayed over a different range.
 * @param {{ first_sequence: string | number, last_sequence: string | number, root_hash: string }} root
 * @returns {Buffer}
 */
export function rootSigningPayload(root) {
  return Buffer.from(`${root.first_sequence}:${root.last_sequence}:${root.root_hash}`, 'utf8');
}

/**
 * The bytes a ledger row signature covers.
 * @param {{ current_hash: string }} row
 * @returns {Buffer}
 */
export function entrySigningPayload(row) {
  return Buffer.from(row.current_hash, 'utf8');
}
