// path: scripts/db/assert.mjs
/**
 * db:assert -- run every SQL assertion against the live database.
 *
 * Each file in `scripts/db/sql/` is one read-only statement that returns a row
 * per violation and no row when the rule holds. The command runs them inside a
 * read-only transaction, prints the violations and exits 1 when any file found
 * one, so a deploy pipeline can gate on it.
 *
 * A file declares what it covers in its header. Today there are three:
 * `check-schema-standards.sql` (sub-step 2.2), and `check-rls-isolation.sql`
 * and `check-rls-coverage.sql` (sub-step 2.7). The ledger and lock assertions
 * of sub-steps 2.8 and 2.12 add their own files here.
 *
 * Usage:
 *   npm run db:assert
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { REPOSITORY_ROOT, fail, line, runCommand } from './_shared.mjs';

const SQL_DIRECTORY = 'scripts/db/sql';
const SQL_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.sql$/;

await runCommand('db:assert', async (client) => {
  let entries;
  try {
    entries = await readdir(join(REPOSITORY_ROOT, SQL_DIRECTORY));
  } catch {
    fail(`${SQL_DIRECTORY}/ is missing, so no assertion can run`);
  }

  const files = entries.filter((entry) => SQL_FILE_PATTERN.test(entry)).sort();
  if (files.length === 0) {
    fail(`${SQL_DIRECTORY}/ carries no assertion file`);
  }

  line(`db:assert: ${String(files.length)} assertion file(s)`);

  let violationCount = 0;
  for (const entry of files) {
    const file = `${SQL_DIRECTORY}/${entry}`;
    const sql = await readFile(join(REPOSITORY_ROOT, file), 'utf8');
    await client.query('BEGIN READ ONLY');
    let rows;
    try {
      const result = await client.query(sql);
      rows = Array.isArray(result) ? (result[result.length - 1]?.rows ?? []) : result.rows;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      fail(`${file} could not run: ${error instanceof Error ? error.message : String(error)}`);
    }
    await client.query('ROLLBACK');

    if (rows.length === 0) {
      line(`  ${file}: 0 violations`);
      continue;
    }

    line(`  ${file}: ${String(rows.length)} violation(s)`);
    for (const row of rows) {
      const rule = String(row.rule ?? 'violation');
      const object = String(row.object ?? '');
      const detail = String(row.detail ?? '');
      line(`    ${rule}  ${object}  ${detail}`);
    }
    violationCount += rows.length;
  }

  if (violationCount > 0) {
    fail(`${String(violationCount)} schema violation(s) reported above`);
  }
  line(`db:assert PASS (${String(files.length)} assertion file(s), 0 violations)`);
});
