// path: scripts/db/fuzz.mjs
/**
 * db:fuzz -- run the isolation fuzz against the live database (sub-step 2.7).
 *
 * Each file in `scripts/db/fuzz/` is one statement that calls a fuzz function
 * and returns a row per violation. Every statement runs inside a read-write
 * transaction, and that transaction is ALWAYS rolled back, whether the fuzz
 * passes, reports violations, or errors. The fuzz writes synthetic tenants and
 * rows, so the rollback is what leaves the database unchanged. The command
 * exits 1 on any violation, so CI can gate on it.
 *
 * Run it only against a database that may hold test traffic: a fresh database
 * or a staging database. The rollback protects the data, but the command still
 * takes locks and creates rows for the length of the statement.
 *
 * Usage:
 *   npm run db:fuzz
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { REPOSITORY_ROOT, fail, line, runCommand } from './_shared.mjs';

const FUZZ_DIRECTORY = 'scripts/db/fuzz';
const FUZZ_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.sql$/;

await runCommand('db:fuzz', async (client) => {
  let entries;
  try {
    entries = await readdir(join(REPOSITORY_ROOT, FUZZ_DIRECTORY));
  } catch {
    fail(`${FUZZ_DIRECTORY}/ is missing, so no fuzz can run`);
  }

  const files = entries.filter((entry) => FUZZ_FILE_PATTERN.test(entry)).sort();
  if (files.length === 0) {
    fail(`${FUZZ_DIRECTORY}/ carries no fuzz file`);
  }

  line(`db:fuzz: ${String(files.length)} fuzz file(s), every transaction rolled back`);

  let violationCount = 0;
  for (const entry of files) {
    const file = `${FUZZ_DIRECTORY}/${entry}`;
    const sql = await readFile(join(REPOSITORY_ROOT, file), 'utf8');

    await client.query('BEGIN');
    let rows = [];
    let failure = null;
    try {
      const result = await client.query(sql);
      rows = Array.isArray(result) ? (result[result.length - 1]?.rows ?? []) : result.rows;
    } catch (error) {
      failure = error;
    } finally {
      await client.query('ROLLBACK');
    }

    if (failure !== null) {
      fail(
        `${file} could not run: ${failure instanceof Error ? failure.message : String(failure)}`,
      );
    }

    if (rows.length === 0) {
      line(`  ${file}: 0 violations, rolled back`);
      continue;
    }

    line(`  ${file}: ${String(rows.length)} violation(s), rolled back`);
    for (const row of rows) {
      line(
        `    ${String(row.rule ?? 'violation')}  ${String(row.object ?? '')}  ${String(row.detail ?? '')}`,
      );
    }
    violationCount += rows.length;
  }

  if (violationCount > 0) {
    fail(`${String(violationCount)} isolation violation(s) reported above`);
  }
  line(`db:fuzz PASS (${String(files.length)} fuzz file(s), 0 violations, all rolled back)`);
});
