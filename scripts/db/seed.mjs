// path: scripts/db/seed.mjs
/**
 * db:seed -- apply every pending seed file, in timestamp order.
 *
 * A seed is reference data the platform cannot start without: plans, the
 * permission matrix, countries, currencies and tax presets. Seeds are not
 * migrations: they have no down file, they must be idempotent (ON CONFLICT DO
 * NOTHING or an equivalent guard), and the ledger records the checksum so an
 * edited seed stops the runner instead of silently changing a production row.
 *
 * Usage:
 *   npm run db:seed
 *   npm run db:seed -- --dry-run    print the plan and change nothing
 */
import {
  applySeed,
  assertSeedDrift,
  fail,
  hasMigrationLedger,
  line,
  listSeeds,
  readSeedLedger,
  runCommand,
} from './_shared.mjs';

const DRY_RUN = '--dry-run';

await runCommand('db:seed', async (client) => {
  const knownArguments = new Set([DRY_RUN]);
  for (const argument of process.argv.slice(2)) {
    if (!knownArguments.has(argument)) {
      fail(`unknown argument ${argument}; the only flag is ${DRY_RUN}`);
    }
  }
  const dryRun = process.argv.includes(DRY_RUN);

  if (!(await hasMigrationLedger(client))) {
    fail('schema_migrations does not exist; run npm run db:migrate before npm run db:seed');
  }

  const seeds = await listSeeds();
  const ledger = await readSeedLedger(client);
  assertSeedDrift(seeds, ledger);

  if (seeds.length === 0) {
    line('db:seed PASS (no seed files)');
    return;
  }

  const applied = new Set(ledger.map((row) => row.seed_id));
  const pending = seeds.filter((seed) => !applied.has(seed.id));
  const appliedCount = seeds.length - pending.length;

  line(`db:seed: ${String(appliedCount)} already applied, ${String(pending.length)} pending`);

  if (pending.length === 0) {
    line('db:seed PASS (nothing to apply)');
    return;
  }

  if (dryRun) {
    for (const seed of pending) {
      line(`  would apply ${seed.file}`);
    }
    line('db:seed PASS (dry run, nothing applied)');
    return;
  }

  for (const seed of pending) {
    const executionMs = await applySeed(client, seed);
    line(`  applied ${seed.file} in ${String(executionMs)} ms`);
  }
  line(`db:seed PASS (${String(pending.length)} applied)`);
});
