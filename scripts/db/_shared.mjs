// path: scripts/db/_shared.mjs
/**
 * Shared plumbing for the database command line (sub-step 2.1).
 *
 * Three commands use this module: `db:migrate`, `db:rollback` and `db:seed`.
 * Everything they must agree on lives here so the agreement cannot drift:
 *
 *   - how a migration file is named and where it lives;
 *   - what a checksum covers;
 *   - how the advisory lock serializes two runners;
 *   - how a failure is printed without leaking the connection string.
 *
 * CONTRACT
 *
 * 1. A migration is a pair. `migrations/{14 digits}_{snake_case}.sql` is the
 *    up file and `migrations/{14 digits}_{snake_case}_down.sql` reverses it.
 *    Files run in timestamp order and each pair is one atomic change.
 * 2. The runner owns the transaction. A migration file must not open or close
 *    one, and must be safe to run twice: the framework's own tables use
 *    CREATE TABLE IF NOT EXISTS, and domain migrations are written the same
 *    way so a re-run after a failed transaction cannot half-apply.
 * 3. A checksum covers the file on disk with a BOM removed, CRLF folded to LF
 *    and trailing blank lines removed. It does not trim line endings inside
 *    the file: a change to any byte a SQL parser can see changes the hash.
 * 4. The ledger is the only source of applied state. A migration file has no
 *    separate version column anywhere; the timestamp is the version.
 * 5. One advisory lock (`DEPLOYMENT_LOCK_KEY`) serializes migrate, rollback
 *    and seed, so a deployment that runs two runners cannot interleave them.
 */
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Client } from 'pg';
import { z } from 'zod';

export const REPOSITORY_ROOT = process.cwd();
export const MIGRATION_DIRECTORY = 'migrations';
export const SEED_DIRECTORY = 'seeds';
export const FRAMEWORK_MIGRATION_ID = '20260116000000_migration_framework';
export const FILE_NAME_PATTERN = /^(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)\.sql$/;

/**
 * The advisory lock every database command takes. It is the step 2 migration
 * window start, so the value is memorable and cannot collide with a lock a
 * later step picks from its own window without a deliberate copy.
 */
export const DEPLOYMENT_LOCK_KEY = 20260116000000;

/** A lock wait longer than this is a stuck deployment, not a busy one. */
export const LOCK_TIMEOUT = '30s';

const CONNECTION_SCHEMA = z.object({
  DATABASE_URL: z
    .string({
      required_error: 'DATABASE_URL is not set',
      invalid_type_error: 'DATABASE_URL is not a string',
    })
    .min(1, { message: 'DATABASE_URL is empty' })
    .regex(/^postgres(ql)?:\/\/\S+$/, {
      message: 'DATABASE_URL must be a postgresql:// or postgres:// connection string',
    }),
});

/** A failure whose message is meant for the operator, not a stack trace. */
export class CliError extends Error {}

/**
 * Stop the command with one actionable sentence.
 * @param {string} message
 * @returns {never}
 */
export function fail(message) {
  throw new CliError(message);
}

/**
 * Load `.env` when the operator has one and the variable is not already set.
 * The loader never overrides the environment, so a deployment that sets
 * DATABASE_URL explicitly keeps its value.
 */
function loadDotEnvIfPresent() {
  const file = join(REPOSITORY_ROOT, '.env');
  if (process.env.DATABASE_URL !== undefined || !existsSync(file)) {
    return;
  }
  try {
    process.loadEnvFile(file);
  } catch {
    fail('the .env file exists but cannot be read; fix its permissions or remove it');
  }
}

/**
 * Read and validate the connection string. It is never printed: every error
 * path runs through describeError, which removes it again.
 * @returns {string}
 */
export function loadDatabaseUrl() {
  loadDotEnvIfPresent();
  const parsed = CONNECTION_SCHEMA.safeParse(process.env);
  if (!parsed.success) {
    const detail = parsed.error.issues.map((issue) => issue.message).join('; ');
    fail(`database configuration is invalid: ${detail}`);
  }
  return parsed.data.DATABASE_URL;
}

/**
 * Turn any thrown value into one line that is safe to print.
 * @param {unknown} error
 * @returns {string}
 */
export function describeError(error) {
  const raw = error instanceof Error ? error.message : String(error);
  const connectionString = process.env.DATABASE_URL;
  const withoutConnectionString =
    connectionString === undefined || connectionString.length === 0
      ? raw
      : raw.split(connectionString).join('[connection string redacted]');
  return withoutConnectionString.replace(/password=([^\s&]+)/gi, 'password=[redacted]');
}

/**
 * Open one client, with a bounded lock wait and a name that database
 * monitoring can attribute to this repository.
 * @returns {Promise<import('pg').Client>}
 */
export async function connect() {
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    application_name: 'kd-db-cli',
  });
  await client.connect();
  await client.query('SELECT set_config($1, $2, false)', ['lock_timeout', LOCK_TIMEOUT]);
  return client;
}

/**
 * Remove the parts of a file that a checkout may legitimately change.
 * @param {string} text
 * @returns {string}
 */
export function normalizeSql(text) {
  return text
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n+$/, '\n');
}

/**
 * Discover the migration pairs, in the order they must run.
 * @returns {Promise<Array<{ id: string, timestamp: string, description: string, upFile: string, downFile: string, checksum: string, sql: string, downSql: string }>>}
 */
export async function listMigrations() {
  const directory = join(REPOSITORY_ROOT, MIGRATION_DIRECTORY);
  let entries;
  try {
    entries = await readdir(directory);
  } catch {
    fail(`${MIGRATION_DIRECTORY}/ is missing from the repository root`);
  }
  const ups = new Map();
  const downs = new Set();
  for (const entry of entries) {
    if (!entry.endsWith('.sql')) {
      continue;
    }
    if (entry.endsWith('_down.sql')) {
      downs.add(entry.slice(0, -'_down.sql'.length));
      continue;
    }
    const match = FILE_NAME_PATTERN.exec(entry);
    if (match === null) {
      fail(
        `${MIGRATION_DIRECTORY}/${entry} must be named {14-digit-timestamp}_{snake_case_description}.sql`,
      );
    }
    ups.set(entry.slice(0, -'.sql'.length), {
      timestamp: match[1],
      description: match[2],
    });
  }
  const ids = [...ups.keys()].sort();
  const files = [];
  for (const id of ids) {
    const entry = ups.get(id);
    if (entry === undefined) {
      continue;
    }
    if (!downs.has(id)) {
      fail(
        `${MIGRATION_DIRECTORY}/${id}_down.sql is missing; every migration needs a rollback pair`,
      );
    }
    const upFile = `${MIGRATION_DIRECTORY}/${id}.sql`;
    const downFile = `${MIGRATION_DIRECTORY}/${id}_down.sql`;
    const upText = await readFile(join(REPOSITORY_ROOT, upFile), 'utf8');
    const downText = await readFile(join(REPOSITORY_ROOT, downFile), 'utf8');
    files.push({
      id,
      timestamp: entry.timestamp,
      description: entry.description,
      upFile,
      downFile,
      checksum: createHash('sha256').update(normalizeSql(upText)).digest('hex'),
      sql: upText,
      downSql: downText,
    });
  }
  return files;
}

/**
 * Discover the seed files, in the order they must run.
 * @returns {Promise<Array<{ id: string, description: string, file: string, checksum: string, sql: string }>>}
 */
export async function listSeeds() {
  const directory = join(REPOSITORY_ROOT, SEED_DIRECTORY);
  let entries;
  try {
    entries = await readdir(directory);
  } catch {
    fail(`${SEED_DIRECTORY}/ is missing from the repository root`);
  }
  const seeds = [];
  for (const entry of entries.sort()) {
    if (!entry.endsWith('.sql') || entry.endsWith('_down.sql')) {
      continue;
    }
    const match = FILE_NAME_PATTERN.exec(entry);
    if (match === null) {
      fail(
        `${SEED_DIRECTORY}/${entry} must be named {14-digit-timestamp}_{snake_case_description}.sql`,
      );
    }
    const file = `${SEED_DIRECTORY}/${entry}`;
    const text = await readFile(join(REPOSITORY_ROOT, file), 'utf8');
    seeds.push({
      id: entry.slice(0, -'.sql'.length),
      description: match[2],
      file,
      checksum: createHash('sha256').update(normalizeSql(text)).digest('hex'),
      sql: text,
    });
  }
  return seeds;
}

/**
 * Does the migration ledger exist? A fresh database answers no, and the
 * runner then applies the framework migration first.
 * @param {import('pg').Client} client
 * @returns {Promise<boolean>}
 */
export async function hasMigrationLedger(client) {
  const { rows } = await client.query("SELECT to_regclass('public.schema_migrations') AS name");
  return rows[0]?.name !== null && rows[0]?.name !== undefined;
}

/**
 * @param {import('pg').Client} client
 * @returns {Promise<Array<{ migration_id: string, checksum: string }>>}
 */
export async function readMigrationLedger(client) {
  const { rows } = await client.query(
    'SELECT migration_id, checksum FROM schema_migrations ORDER BY migration_id',
  );
  return rows;
}

/**
 * @param {import('pg').Client} client
 * @returns {Promise<Array<{ seed_id: string, checksum: string }>>}
 */
export async function readSeedLedger(client) {
  const { rows } = await client.query(
    'SELECT seed_id, checksum FROM seed_migrations ORDER BY seed_id',
  );
  return rows;
}

/**
 * Refuse to continue when an applied file no longer matches its record, or
 * when the database records a file the repository does not carry.
 * @param {Array<{ id: string, checksum: string, upFile: string }>} files
 * @param {Array<{ migration_id: string, checksum: string }>} ledger
 */
export function assertMigrationDrift(files, ledger) {
  const byId = new Map(files.map((file) => [file.id, file]));
  for (const row of ledger) {
    const file = byId.get(row.migration_id);
    if (file === undefined) {
      fail(
        `the database records ${row.migration_id} but ${MIGRATION_DIRECTORY}/${row.migration_id}.sql is missing; restore the file before running again`,
      );
    }
    if (file.checksum !== row.checksum) {
      fail(
        `checksum drift on ${file.upFile}: applied as ${row.checksum} and the file now hashes to ${file.checksum}; an applied migration is never edited, add a new migration instead`,
      );
    }
  }
}

/**
 * @param {Array<{ id: string, checksum: string, file: string }>} seeds
 * @param {Array<{ seed_id: string, checksum: string }>} ledger
 */
export function assertSeedDrift(seeds, ledger) {
  const byId = new Map(seeds.map((seed) => [seed.id, seed]));
  for (const row of ledger) {
    const seed = byId.get(row.seed_id);
    if (seed === undefined) {
      fail(
        `the database records seed ${row.seed_id} but ${SEED_DIRECTORY}/${row.seed_id}.sql is missing; restore the file before running again`,
      );
    }
    if (seed.checksum !== row.checksum) {
      fail(
        `checksum drift on ${seed.file}: applied as ${row.checksum} and the file now hashes to ${seed.checksum}; an applied seed is never edited, add a new seed instead`,
      );
    }
  }
}

/**
 * Apply one migration inside one transaction and record it. On a fresh
 * database the file itself creates the ledger, which is why the insert runs
 * after the file and inside the same transaction.
 * @param {import('pg').Client} client
 * @param {{ id: string, description: string, checksum: string, sql: string }} file
 * @returns {Promise<number>} elapsed milliseconds
 */
export async function applyMigration(client, file) {
  const startedAt = process.hrtime.bigint();
  await client.query('BEGIN');
  try {
    await client.query(file.sql);
    const executionMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
    await client.query(
      `INSERT INTO schema_migrations (migration_id, description, checksum, execution_ms)
       VALUES ($1, $2, $3, $4)`,
      [file.id, file.description, file.checksum, executionMs],
    );
    await client.query('COMMIT');
    return executionMs;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

/**
 * Revert one migration inside one transaction. The ledger row is deleted
 * first because the framework rollback drops the ledger table itself; if the
 * rollback file fails, the deletion rolls back with it.
 * @param {import('pg').Client} client
 * @param {{ id: string, downSql: string }} file
 * @returns {Promise<number>} elapsed milliseconds
 */
export async function revertMigration(client, file) {
  const startedAt = process.hrtime.bigint();
  await client.query('BEGIN');
  try {
    await client.query('DELETE FROM schema_migrations WHERE migration_id = $1', [file.id]);
    await client.query(file.downSql);
    const executionMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
    await client.query('COMMIT');
    return executionMs;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

/**
 * Apply one seed inside one transaction and record it.
 * @param {import('pg').Client} client
 * @param {{ id: string, description: string, checksum: string, sql: string }} seed
 * @returns {Promise<number>} elapsed milliseconds
 */
export async function applySeed(client, seed) {
  const startedAt = process.hrtime.bigint();
  await client.query('BEGIN');
  try {
    await client.query(seed.sql);
    const executionMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
    await client.query(
      `INSERT INTO seed_migrations (seed_id, description, checksum, execution_ms)
       VALUES ($1, $2, $3, $4)`,
      [seed.id, seed.description, seed.checksum, executionMs],
    );
    await client.query('COMMIT');
    return executionMs;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

/**
 * Run a handler under the deployment advisory lock. The lock is released even
 * when the handler throws, and a dropped connection releases it as well.
 * @param {import('pg').Client} client
 * @param {() => Promise<void>} handler
 */
export async function withDeploymentLock(client, handler) {
  await client.query('SELECT pg_advisory_lock($1::bigint)', [DEPLOYMENT_LOCK_KEY]);
  try {
    await handler();
  } finally {
    await client.query('SELECT pg_advisory_unlock($1::bigint)', [DEPLOYMENT_LOCK_KEY]);
  }
}

/**
 * One line on stdout. The console object is forbidden in this repository, and
 * every database command writes through here.
 * @param {string} text
 */
export function line(text) {
  process.stdout.write(`${text}\n`);
}

/**
 * The entry point every database command shares: connect, take the lock, run,
 * close, and turn a failure into one actionable line plus exit code 1.
 * @param {string} name command name, for example "db:migrate"
 * @param {(client: import('pg').Client) => Promise<void>} handler
 */
export async function runCommand(name, handler) {
  let client;
  try {
    client = await connect();
    await withDeploymentLock(client, () => handler(client));
  } catch (error) {
    line(`${name} FAIL`);
    const message = describeError(error);
    if (error instanceof CliError) {
      line(`  ${message}`);
    } else {
      const code =
        typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null;
      line(code === null || message.includes(code) ? `  ${message}` : `  ${message} (${code})`);
    }
    process.exitCode = 1;
  } finally {
    if (client !== undefined) {
      await client.end().catch(() => undefined);
    }
  }
}
