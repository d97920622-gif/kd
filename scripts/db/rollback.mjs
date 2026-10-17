// path: scripts/db/rollback.mjs
/**
 * db:rollback -- revert one migration and every migration applied after it.
 *
 * The argument is the 14-digit timestamp of the oldest migration that should
 * be reverted. Rolling back `all` reverts the whole set, newest first, which
 * is how the fresh-database gate proves that an up file and its down file
 * describe the same schema.
 *
 * Each migration is reverted in its own transaction, and the down file runs
 * after its ledger row is deleted (inside the same transaction) because the
 * framework rollback removes the ledger table itself.
 *
 * Usage:
 *   npm run db:rollback -- 20260116000000
 *   npm run db:rollback -- all
 */
import {
  assertMigrationDrift,
  fail,
  hasMigrationLedger,
  line,
  listMigrations,
  readMigrationLedger,
  revertMigration,
  runCommand,
} from './_shared.mjs';

const TIMESTAMP_PATTERN = /^\d{14}$/;
const ALL = 'all';

await runCommand('db:rollback', async (client) => {
  const targets = process.argv.slice(2);
  if (targets.length !== 1) {
    fail('usage: npm run db:rollback -- <14-digit timestamp>|all');
  }
  const target = targets[0];

  if (!(target === ALL || TIMESTAMP_PATTERN.test(target))) {
    fail(
      `rollback target ${target} is not a 14-digit timestamp or the word all; the timestamp is the migration file prefix`,
    );
  }

  if (!(await hasMigrationLedger(client))) {
    line('db:rollback PASS (no ledger, nothing to revert)');
    return;
  }

  const files = await listMigrations();
  const ledger = await readMigrationLedger(client);
  assertMigrationDrift(files, ledger);

  if (ledger.length === 0) {
    line('db:rollback PASS (nothing applied)');
    return;
  }

  const byId = new Map(files.map((file) => [file.id, file]));
  let selection;
  if (target === ALL) {
    selection = [...ledger].reverse();
  } else {
    const oldest = ledger.find(
      (row) => row.migration_id === target || row.migration_id.startsWith(`${target}_`),
    );
    if (oldest === undefined) {
      fail(`${target} is not applied, so there is nothing to roll back to it`);
    }
    selection = ledger.filter((row) => row.migration_id >= oldest.migration_id).reverse();
  }

  line(`db:rollback: ${String(selection.length)} migration(s) selected`);

  for (const row of selection) {
    const file = byId.get(row.migration_id);
    if (file === undefined) {
      fail(
        `the database records ${row.migration_id} but its file is missing; restore the pair before rolling back`,
      );
    }
    const executionMs = await revertMigration(client, file);
    line(`  reverted ${file.upFile} in ${String(executionMs)} ms`);
  }

  line(`db:rollback PASS (${String(selection.length)} reverted)`);
});
