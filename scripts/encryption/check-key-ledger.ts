// path: scripts/encryption/check-key-ledger.ts
/**
 * encryption:ledger:check -- the recorded key versions agree with the config
 * and with the environment root key.
 *
 * For each purpose, the command requires:
 *   1. exactly one active version, and it equals ENCRYPTION_CONFIG.activeVersions;
 *   2. the versions are contiguous from 1 with no gap;
 *   3. every recorded key check equals the key check the environment root key
 *      derives for that version, so the deployed root key is the one that was
 *      activated. A mismatch means a different root key, and writes made under
 *      it would not open.
 *
 * A purpose with no recorded version fails. Bootstrap records version 1 with
 * encryption:key:activate before the first deploy. Exit 1 on any finding; the
 * key check values are never printed.
 */
import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_PURPOSES,
  type Db,
  fail,
  integerOf,
  runCommand,
  start,
  textOf,
  vaultFromEnvironment,
  write,
  type EncryptionPurpose,
} from './_shared';

interface LedgerRow {
  readonly purpose: EncryptionPurpose;
  readonly keyVersion: number;
  readonly state: string;
  readonly keyCheck: string;
}

const findings: string[] = [];

function finding(message: string): void {
  findings.push(message);
}

function rowsFor(rows: readonly LedgerRow[], purpose: EncryptionPurpose): LedgerRow[] {
  return rows.filter((row) => row.purpose === purpose).sort((a, b) => a.keyVersion - b.keyVersion);
}

start(async () => {
  const vault = vaultFromEnvironment();

  await runCommand('encryption:ledger:check', async (client: Db) => {
    const result = await client.query(
      'SELECT purpose, key_version, state, key_check FROM encryption_key_versions WHERE deleted_at IS NULL ORDER BY purpose, key_version',
    );
    const rows: LedgerRow[] = result.rows.map((row) => ({
      purpose: textOf(row.purpose, 'purpose') as EncryptionPurpose,
      keyVersion: integerOf(row.key_version, 'key_version'),
      state: textOf(row.state, 'state'),
      keyCheck: textOf(row.key_check, 'key_check'),
    }));

    for (const purpose of ENCRYPTION_PURPOSES) {
      const versions = rowsFor(rows, purpose);
      if (versions.length === 0) {
        finding(
          `${purpose}: no key version is recorded; run encryption:key:activate for version 1`,
        );
        continue;
      }

      const active = versions.filter((row) => row.state === 'active');
      const configured = ENCRYPTION_CONFIG.activeVersions[purpose];
      if (active.length !== 1) {
        finding(`${purpose}: expected one active version, found ${String(active.length)}`);
      } else if (active[0]?.keyVersion !== configured) {
        finding(
          `${purpose}: the database has version ${String(active[0]?.keyVersion)} active but config activates ${String(configured)}`,
        );
      }

      versions.forEach((row, index) => {
        if (row.keyVersion !== index + 1) {
          finding(
            `${purpose}: versions are not contiguous from 1 (found ${String(row.keyVersion)} at position ${String(index + 1)})`,
          );
        }
      });

      for (const row of versions) {
        const expected = vault.keyCheck(purpose, row.keyVersion);
        if (expected !== row.keyCheck) {
          finding(
            `${purpose}: key check of version ${String(row.keyVersion)} does not match the environment root key`,
          );
        }
      }
    }

    if (findings.length > 0) {
      for (const message of findings) {
        write(`encryption ledger: ${message}`);
      }
      fail(`${String(findings.length)} findings; see the lines above`);
    }
    const summary = ENCRYPTION_PURPOSES.map(
      (purpose) => `${purpose} active ${String(ENCRYPTION_CONFIG.activeVersions[purpose])}`,
    ).join(', ');
    write(`encryption:ledger:check PASS (${summary}; key checks match the environment root key)`);
  });
});
