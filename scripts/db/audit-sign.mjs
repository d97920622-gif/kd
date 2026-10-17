// path: scripts/db/audit-sign.mjs
/**
 * db:audit:sign -- checkpoint the ledger, then sign every unsigned row and root.
 *
 * The Ed25519 private key is read from AUDIT_SIGNING_PRIVATE_KEY, a PKCS#8 PEM,
 * and is never written, logged or stored in the database. The database holds only
 * the public key, which this command registers the first time it sees it. The
 * key id is AUDIT_SIGNING_KEY_ID, and a key id that is already registered with a
 * different public key is refused, so one name cannot quietly change its key.
 *
 * The command refuses to sign while audit_verify_chain() reports any violation.
 * A signature over a tampered row would make the tampering look authentic, so the
 * signer signs only a chain that verifies.
 *
 * Each step runs in its own statement. A signature is attached once, by the
 * database function audit_attach_signature, so a second run finds nothing to do.
 *
 * Usage:
 *   AUDIT_SIGNING_KEY_ID=<id> AUDIT_SIGNING_PRIVATE_KEY="$(cat key.pem)" npm run db:audit:sign
 */
import { createPrivateKey, createPublicKey, sign } from 'node:crypto';

import {
  BATCH_SIZE,
  KEY_ID_ENVIRONMENT,
  PRIVATE_KEY_ENVIRONMENT,
  SIGNING_KEY_ID_PATTERN,
  entrySigningPayload,
  rootSigningPayload,
} from './_audit.mjs';
import { fail, line, runCommand } from './_shared.mjs';

await runCommand('db:audit:sign', async (client) => {
  const keyId = process.env[KEY_ID_ENVIRONMENT] ?? '';
  if (!SIGNING_KEY_ID_PATTERN.test(keyId)) {
    fail(
      `${KEY_ID_ENVIRONMENT} must be 3 to 64 characters: lowercase letters, digits, dot, underscore or hyphen`,
    );
  }

  let privateKey;
  try {
    privateKey = createPrivateKey(process.env[PRIVATE_KEY_ENVIRONMENT] ?? '');
  } catch {
    fail(`${PRIVATE_KEY_ENVIRONMENT} is not a PEM private key (PKCS#8)`);
  }
  if (privateKey.asymmetricKeyType !== 'ed25519') {
    fail(`${PRIVATE_KEY_ENVIRONMENT} must hold an Ed25519 key`);
  }
  const publicPem = createPublicKey(privateKey).export({ type: 'spki', format: 'pem' });

  const registered = await client.query(
    'SELECT id, public_key_pem FROM audit_signing_keys WHERE key_id = $1 AND deleted_at IS NULL',
    [keyId],
  );
  let keyUuid;
  if (registered.rows.length === 0) {
    const inserted = await client.query('SELECT audit_register_signing_key($1, $2) AS id', [
      keyId,
      publicPem,
    ]);
    keyUuid = inserted.rows[0].id;
    line(`  registered signing key ${keyId}`);
  } else {
    if (registered.rows[0].public_key_pem !== publicPem) {
      fail(`key ${keyId} is registered with a different public key; refusing to sign`);
    }
    keyUuid = registered.rows[0].id;
  }

  const violations = await client.query('SELECT count(*)::int AS count FROM audit_verify_chain()');
  if (violations.rows[0].count > 0) {
    fail(
      `refusing to sign: audit_verify_chain reports ${String(violations.rows[0].count)} violation(s); run npm run db:assert`,
    );
  }

  const checkpoint = await client.query('SELECT audit_merkle_checkpoint() AS id');
  line(
    checkpoint.rows[0].id === null
      ? '  no ledger change since the last checkpoint, so none was written'
      : '  wrote a Merkle checkpoint over the ledger rows since the last one',
  );

  let signedEntries = 0;
  for (;;) {
    const batch = await client.query(
      'SELECT id, current_hash FROM audit_logs WHERE signature IS NULL ORDER BY sequence_number LIMIT $1',
      [BATCH_SIZE],
    );
    if (batch.rows.length === 0) {
      break;
    }
    for (const row of batch.rows) {
      const signature = sign(null, entrySigningPayload(row), privateKey).toString('base64');
      const attached = await client.query('SELECT audit_attach_signature($1, $2, $3) AS attached', [
        row.id,
        keyUuid,
        signature,
      ]);
      if (attached.rows[0].attached !== true) {
        fail(`could not attach the signature to ledger row ${row.id}`);
      }
      signedEntries += 1;
    }
  }

  const roots = await client.query(
    'SELECT id, first_sequence, last_sequence, root_hash FROM audit_merkle_roots WHERE signature IS NULL ORDER BY last_sequence',
  );
  let signedRoots = 0;
  for (const root of roots.rows) {
    const signature = sign(null, rootSigningPayload(root), privateKey).toString('base64');
    const attached = await client.query(
      'SELECT audit_attach_root_signature($1, $2, $3) AS attached',
      [root.id, keyUuid, signature],
    );
    if (attached.rows[0].attached !== true) {
      fail(`could not attach the signature to Merkle root ${root.id}`);
    }
    signedRoots += 1;
  }

  line(
    `db:audit:sign PASS: ${String(signedEntries)} ledger row(s) and ${String(signedRoots)} Merkle root(s) signed with ${keyId}`,
  );
});
