// path: scripts/encryption/activate-key-version.ts
/**
 * encryption:key:activate -- record the next key version for a purpose.
 *
 * Usage:
 *   npm run encryption:key:activate -- --purpose field --version 2 \
 *     --reason "scheduled 90 day rotation"
 *
 * The command computes the key check for the version from the environment root
 * key and calls encryption_activate_key_version(), which retires the current
 * active version and records the new one in one transaction. The database
 * refuses a version that is not the next number, and refuses a caller that is
 * neither a super_admin nor a deployment role.
 *
 * Activation is the first half of a rotation. The second half is a deploy that
 * sets the same version in config/encryption.ts (ENCRYPTION_CONFIG.activeVersions),
 * which npm run encryption:ledger:check then confirms. Until that deploy, new
 * writes still use the old version, and the ledger check fails on purpose.
 */
import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_PURPOSES,
  type Db,
  fail,
  runCommand,
  start,
  textOf,
  vaultFromEnvironment,
  withInternalMessages,
  write,
  type EncryptionPurpose,
} from './_shared';

interface Arguments {
  readonly purpose: EncryptionPurpose;
  readonly version: number;
  readonly reason: string;
}

const USAGE =
  'usage: npm run encryption:key:activate -- --purpose <field|blind_index> --version <n> --reason "<text>"';

function parseArguments(argv: readonly string[]): Arguments {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      flag === undefined ||
      !flag.startsWith('--') ||
      value === undefined ||
      value.startsWith('--')
    ) {
      fail(USAGE);
    }
    if (!['--purpose', '--version', '--reason'].includes(flag) || values.has(flag)) {
      fail(`${USAGE} (unknown or repeated flag ${flag})`);
    }
    values.set(flag, value);
  }
  const purpose = values.get('--purpose');
  const versionText = values.get('--version');
  const reason = values.get('--reason');
  if (purpose === undefined || versionText === undefined || reason === undefined) {
    fail(USAGE);
  }
  if (!(ENCRYPTION_PURPOSES as readonly string[]).includes(purpose)) {
    fail(`purpose must be one of: ${ENCRYPTION_PURPOSES.join(', ')}`);
  }
  if (!/^[1-9][0-9]{0,5}$/.test(versionText)) {
    fail('version must be a whole number of 1 or more');
  }
  const version = Number(versionText);
  if (version > ENCRYPTION_CONFIG.maxKeyVersion) {
    fail(`version must be at most ${String(ENCRYPTION_CONFIG.maxKeyVersion)}`);
  }
  const trimmed = reason.trim();
  if (trimmed.length < 3 || trimmed.length > 200) {
    fail('reason must be 3 to 200 characters');
  }
  return { purpose: purpose as EncryptionPurpose, version, reason: trimmed };
}

async function main(): Promise<void> {
  const args = parseArguments(process.argv.slice(2));
  const vault = vaultFromEnvironment();
  const keyCheck = withInternalMessages(() => vault.keyCheck(args.purpose, args.version));

  await runCommand('encryption:key:activate', async (client: Db) => {
    const result = await client.query(
      'SELECT encryption_activate_key_version($1, $2, $3, $4) AS id',
      [args.purpose, args.version, keyCheck, args.reason],
    );
    const row = result.rows[0];
    if (row === undefined) {
      fail('activation returned no row');
    }
    const id = textOf(row.id, 'id');
    write(
      `encryption:key:activate PASS purpose=${args.purpose} key_version=${String(args.version)} record=${id}`,
    );
    write(
      `next: set ${args.purpose} to ${String(args.version)} in ENCRYPTION_CONFIG.activeVersions, deploy, then run npm run encryption:ledger:check`,
    );
  });
}

start(main);
