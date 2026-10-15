// path: scripts/checks/migration-pairs.mjs
/**
 * check:migration-pairs -- every migration exists as an up and a down file.
 *
 * Migration naming convention (MASTER_PROMPT and the plan):
 *   migrations/{timestamp}_{description}.sql
 *   migrations/{timestamp}_{description}_down.sql
 * The timestamp is fourteen digits and must be unique across the directory.
 * The step-owning timestamp windows are listed in
 * docs/PLAN/00_MASTER_EXECUTION_PLAN.md section 3 and are reviewed at merge
 * time; this check enforces the naming and pairing contract.
 *
 * When the migrations directory does not exist yet (steps 1 and 2 create it)
 * the check passes and reports that there is nothing to verify.
 */
import { listTrackedFiles, reportResult } from './_lib.mjs';

const MIGRATION_DIRECTORY = 'migrations/';
const FILE_PATTERN = /^migrations\/(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)(_down)?\.sql$/;

function collect(files) {
  const ups = new Map();
  const downs = new Map();
  const findings = [];
  const timestamps = new Map();
  for (const file of files) {
    if (!file.startsWith(MIGRATION_DIRECTORY)) {
      continue;
    }
    const match = FILE_PATTERN.exec(file);
    if (match === null) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message:
          'migration name must match {14-digit-timestamp}_{snake_case_description}[_down].sql',
      });
      continue;
    }
    const timestamp = match[1];
    const description = match[2];
    const isDown = match[3] === '_down';
    const key = `${timestamp}_${description}`;
    const seen = timestamps.get(timestamp);
    if (seen !== undefined) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message: `timestamp ${timestamp} is already used by ${seen}`,
      });
    } else {
      timestamps.set(timestamp, file);
    }
    if (isDown) {
      downs.set(key, file);
    } else {
      ups.set(key, file);
    }
  }
  return { ups, downs, findings };
}

function findPairFindings(ups, downs) {
  const findings = [];
  for (const [key, file] of ups.entries()) {
    if (!downs.has(key)) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message: `missing rollback file: migrations/${key}_down.sql`,
      });
    }
  }
  for (const [key, file] of downs.entries()) {
    if (!ups.has(key)) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message: `rollback file has no matching forward migration: migrations/${key}.sql`,
      });
    }
  }
  return findings;
}

function main() {
  const files = listTrackedFiles();
  const migrationFiles = files.filter((file) => file.startsWith(MIGRATION_DIRECTORY));
  const { ups, downs, findings } = collect(files);
  findings.push(...findPairFindings(ups, downs));
  if (migrationFiles.length === 0) {
    reportResult('migration-pairs', findings, 'no migrations yet: nothing to pair');
    return;
  }
  reportResult(
    'migration-pairs',
    findings,
    `${ups.size} forward migrations paired with ${downs.size} rollback files`,
  );
}

main();
