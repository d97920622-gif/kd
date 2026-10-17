// path: scripts/db/migrate.mjs
/**
 * db:migrate -- apply every pending migration, in timestamp order.
 *
 * The command is safe to run repeatedly and safe to run twice at once: the
 * advisory lock serializes runners, the ledger decides what is pending, and a
 * checksum mismatch stops the run before anything is applied.
 *
 * Usage:
 *   npm run db:migrate
 *   npm run db:migrate -- --dry-run    print the plan and change nothing
 */
import {
  FRAMEWORK_MIGRATION_ID,
  MIGRATION_DIRECTORY,
  applyMigration,
  assertMigrationDrift,
  fail,
  hasMigrationLedger,
  line,
  listMigrations,
  readMigrationLedger,
  runCommand,
} from './_shared.mjs';

const DRY_RUN = '--dry-run';

await runCommand('db:migrate', async (client) => {
  const knownArguments = new Set([DRY_RUN]);
  for (const argument of process.argv.slice(2)) {
    if (!knownArguments.has(argument)) {
      fail(`unknown argument ${argument}; the only flag is ${DRY_RUN}`);
    }
  }
  const dryRun = process.argv.includes(DRY_RUN);

  const files = await listMigrations();
  const ledgerExists = await hasMigrationLedger(client);
  if (!ledgerExists && files.length > 0 && files[0].id !== FRAMEWORK_MIGRATION_ID) {
    fail(
      `${MIGRATION_DIRECTORY}/${FRAMEWORK_MIGRATION_ID}.sql is missing, so no ledger can be created and the applied state is unknown; restore the framework migration first`,
    );
  }

  const ledger = ledgerExists ? await readMigrationLedger(client) : [];
  assertMigrationDrift(files, ledger);

  if (files.length === 0) {
    line('db:migrate PASS (no migration files)');
    return;
  }

  const applied = new Set(ledger.map((row) => row.migration_id));
  const pending = files.filter((file) => !applied.has(file.id));
  const appliedCount = files.length - pending.length;

  line(`db:migrate: ${String(appliedCount)} already applied, ${String(pending.length)} pending`);

  if (pending.length === 0) {
    line('db:migrate PASS (nothing to apply)');
    return;
  }

  if (dryRun) {
    for (const file of pending) {
      line(`  would apply ${file.upFile}`);
    }
    line('db:migrate PASS (dry run, nothing applied)');
    return;
  }

  for (const file of pending) {
    const executionMs = await applyMigration(client, file);
    line(`  applied ${file.upFile} in ${String(executionMs)} ms`);
  }
  line(`db:migrate PASS (${String(pending.length)} applied)`);
});
