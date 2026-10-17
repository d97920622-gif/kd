// path: scripts/db/audit-verify.mjs
/**
 * db:audit:verify -- check every signature on the ledger and on its Merkle roots.
 *
 * Each row is checked against the public key registered under its signing_key_id.
 * Keys are read whatever their deleted_at, because a retired key still signed the
 * rows it signed. A row with no signature is reported: the signer has not reached
 * it yet, or the row was never signed. Either way the ledger is not fully attested.
 *
 * The command also runs audit_verify_chain(), so a row whose content changed
 * fails here too, even when its signature was never touched. The chain check
 * needs no key. The signatures are checked on top of it, and the two together are
 * the full check.
 *
 * Usage: npm run db:audit:verify
 */
import { createPublicKey, verify } from 'node:crypto';

import { BATCH_SIZE, entrySigningPayload, rootSigningPayload } from './_audit.mjs';
import { fail, line, runCommand } from './_shared.mjs';

const REPORTED_LIMIT = 10;

await runCommand('db:audit:verify', async (client) => {
  const keyRows = await client.query('SELECT id, key_id, public_key_pem FROM audit_signing_keys');
  const keys = new Map();
  for (const key of keyRows.rows) {
    keys.set(key.id, { keyId: key.key_id, publicKey: createPublicKey(key.public_key_pem) });
  }

  const unsigned = [];
  const invalid = [];
  let checkedEntries = 0;
  let after = '0';
  for (;;) {
    const batch = await client.query(
      'SELECT sequence_number, current_hash, signature, signing_key_id FROM audit_logs WHERE sequence_number > $1::bigint ORDER BY sequence_number LIMIT $2',
      [after, BATCH_SIZE],
    );
    if (batch.rows.length === 0) {
      break;
    }
    for (const row of batch.rows) {
      checkedEntries += 1;
      if (row.signature === null) {
        unsigned.push(String(row.sequence_number));
        continue;
      }
      const key = keys.get(row.signing_key_id);
      const valid =
        key !== undefined &&
        verify(null, entrySigningPayload(row), key.publicKey, Buffer.from(row.signature, 'base64'));
      if (!valid) {
        invalid.push(`ledger sequence ${String(row.sequence_number)}`);
      }
    }
    after = String(batch.rows[batch.rows.length - 1].sequence_number);
  }

  const roots = await client.query(
    'SELECT first_sequence, last_sequence, root_hash, signature, signing_key_id FROM audit_merkle_roots ORDER BY last_sequence',
  );
  for (const root of roots.rows) {
    if (root.signature === null) {
      unsigned.push(`root ${String(root.first_sequence)}-${String(root.last_sequence)}`);
      continue;
    }
    const key = keys.get(root.signing_key_id);
    const valid =
      key !== undefined &&
      verify(null, rootSigningPayload(root), key.publicKey, Buffer.from(root.signature, 'base64'));
    if (!valid) {
      invalid.push(`root ${String(root.first_sequence)}-${String(root.last_sequence)}`);
    }
  }

  const chainCount = await client.query('SELECT count(*)::int AS count FROM audit_verify_chain()');
  const chainViolations = Number(chainCount.rows[0].count);
  if (chainViolations > 0) {
    const sample = await client.query(
      'SELECT rule, object, detail FROM audit_verify_chain() ORDER BY rule, object LIMIT $1',
      [REPORTED_LIMIT],
    );
    for (const v of sample.rows) {
      line(`  chain ${v.rule} on ${v.object}: ${v.detail}`);
    }
  }

  line(
    `  checked ${String(checkedEntries)} ledger row(s) and ${String(roots.rows.length)} root(s) against ${String(keys.size)} key(s)`,
  );
  if (unsigned.length > 0) {
    line(`  unsigned: ${unsigned.slice(0, REPORTED_LIMIT).join(', ')}`);
  }
  if (invalid.length > 0) {
    line(`  invalid signature: ${invalid.slice(0, REPORTED_LIMIT).join(', ')}`);
  }
  if (unsigned.length > 0 || invalid.length > 0 || chainViolations > 0) {
    const parts = [];
    if (chainViolations > 0) {
      parts.push(
        `${String(chainViolations)} chain violation(s): the ledger changed, run npm run db:assert for detail`,
      );
    }
    if (unsigned.length > 0) {
      parts.push(`${String(unsigned.length)} unsigned (run npm run db:audit:sign to clear them)`);
    }
    if (invalid.length > 0) {
      parts.push(
        `${String(invalid.length)} invalid signature(s): the row changed after it was signed`,
      );
    }
    fail(parts.join('; '));
  }
  line(
    'db:audit:verify PASS: the hash chain holds and every ledger row and root carries a valid signature',
  );
});
