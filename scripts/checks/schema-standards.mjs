// path: scripts/checks/schema-standards.mjs
/**
 * check:schema-standards -- the schema standards are visible in the migrations.
 *
 * The catalog is the authority (scripts/db/sql/check-schema-standards.sql runs
 * against a live database in the CI database job), but `npm run verify` has no
 * database and every push must still fail when a migration is written outside
 * the standard. This check reads the migration files and enforces what text
 * can prove:
 *
 *   1. every migration timestamp is inside the step 2 window;
 *   2. no migration opens or closes a transaction, because the runner owns it;
 *   3. every CREATE TABLE at or after the primitives migration declares the six
 *      universal columns, with the expected type, nullability and default;
 *   4. timestamps are timestamptz; no money, real or double precision column
 *      exists; every numeric column is numeric(18,4);
 *   5. every REFERENCES carries ON DELETE RESTRICT;
 *   6. every CREATE INDEX is named idx_{table}_{columns};
 *   7. every named CHECK is chk_{table}_{column}_{rule} and every named
 *      FOREIGN KEY is fk_{table}_{referenced_table}.
 *
 * The universal column rules apply from 20260116010000_database_primitives
 * onward: the 2.1 framework migration predates the primitives that the later
 * tables use, and the 2.2 migration brings its two tables up to the standard.
 */
import { listTrackedFiles, positionOf, readTextFile, reportResult } from './_lib.mjs';

const SELF = 'scripts/checks/schema-standards.mjs';
const MIGRATION_DIRECTORY = 'migrations/';
const FILE_PATTERN = /^migrations\/(\d{14})_([a-z0-9]+(?:_[a-z0-9]+)*)(?:_down)?\.sql$/;
const STANDARDS_FROM = '20260116010000';
const WINDOW_START = '20260116000000';
const WINDOW_END = '20260116999999';

/** Column definitions every table created from the primitives onward carries. */
const UNIVERSAL_COLUMNS = [
  {
    name: 'id',
    expectation: 'uuid NOT NULL DEFAULT uuid_generate_v7()',
    matches: (definition) =>
      /\buuid\b/i.test(definition.type) &&
      /\bNOT\s+NULL\b/i.test(definition.type) &&
      /\bDEFAULT\s+uuid_generate_v7\s*\(\s*\)/i.test(definition.type),
  },
  {
    name: 'company_id',
    expectation: 'uuid',
    matches: (definition) => /\buuid\b/i.test(definition.type),
  },
  {
    name: 'created_at',
    expectation: 'timestamptz NOT NULL DEFAULT now()',
    matches: (definition) =>
      isTimestamptz(definition.type) &&
      /\bNOT\s+NULL\b/i.test(definition.type) &&
      /\bDEFAULT\s+now\s*\(\s*\)/i.test(definition.type),
  },
  {
    name: 'updated_at',
    expectation: 'timestamptz NOT NULL DEFAULT now()',
    matches: (definition) =>
      isTimestamptz(definition.type) &&
      /\bNOT\s+NULL\b/i.test(definition.type) &&
      /\bDEFAULT\s+now\s*\(\s*\)/i.test(definition.type),
  },
  {
    name: 'deleted_at',
    expectation: 'nullable timestamptz',
    matches: (definition) =>
      isTimestamptz(definition.type) && !/\bNOT\s+NULL\b/i.test(definition.type),
  },
  {
    name: 'version',
    expectation: 'integer NOT NULL DEFAULT 0',
    matches: (definition) =>
      /\binteger\b/i.test(definition.type) &&
      /\bNOT\s+NULL\b/i.test(definition.type) &&
      /\bDEFAULT\s+0\b/i.test(definition.type),
  },
];

/**
 * @param {string} type
 * @returns {boolean}
 */
function isTimestamptz(type) {
  return /\btimestamptz\b/i.test(type) || /\btimestamp\s+with\s+time\s+zone\b/i.test(type);
}

/**
 * Blank comments and string literals without moving any character.
 *
 * The rule scans look for SQL keywords and type names; a comment that
 * explains the word "timestamp", or a COMMENT ON text that mentions it, is
 * prose and not a column. Masking replaces each masked character with a
 * space, so every offset still points at the original file and a finding
 * reports the line a reader can open.
 * @param {string} text
 * @returns {string}
 */
function maskUnscannable(text) {
  const output = text.split('');
  let inLineComment = false;
  let inBlockComment = false;
  let inString = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '\n') {
      inLineComment = false;
      output[index] = character;
      continue;
    }
    if (inLineComment) {
      output[index] = ' ';
      continue;
    }
    if (inBlockComment) {
      if (character === '*' && next === '/') {
        output[index] = ' ';
        output[index + 1] = ' ';
        inBlockComment = false;
        index += 1;
        continue;
      }
      output[index] = ' ';
      continue;
    }
    if (inString) {
      output[index] = character === "'" ? "'" : ' ';
      if (character === "'" && next === "'") {
        output[index + 1] = ' ';
        index += 1;
        continue;
      }
      if (character === "'") {
        inString = false;
      }
      continue;
    }
    if (character === '-' && next === '-') {
      output[index] = ' ';
      output[index + 1] = ' ';
      inLineComment = true;
      index += 1;
      continue;
    }
    if (character === '/' && next === '*') {
      output[index] = ' ';
      output[index + 1] = ' ';
      inBlockComment = true;
      index += 1;
      continue;
    }
    if (character === "'") {
      inString = true;
    }
  }
  return output.join('');
}

/**
 * Split a parenthesised definition list on its top-level commas.
 * @param {string} body
 * @returns {string[]}
 */
function splitDefinitions(body) {
  const parts = [];
  let depth = 0;
  let inString = false;
  let current = '';
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (character === "'") {
      inString = !inString;
    }
    if (!inString) {
      if (character === '(') {
        depth += 1;
      } else if (character === ')') {
        depth -= 1;
      } else if (character === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += character;
  }
  if (current.trim().length > 0) {
    parts.push(current.trim());
  }
  return parts;
}

/**
 * Find every CREATE TABLE in one file, with its column definitions.
 * @param {string} text
 * @returns {Array<{ name: string, index: number, definitions: Array<{ name: string, type: string, raw: string }> }>}
 */
function findCreateTables(text) {
  const tables = [];
  const statement = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z0-9_]+)\s*\(/gi;
  for (const match of text.matchAll(statement)) {
    const open = (match.index ?? 0) + match[0].length - 1;
    let depth = 0;
    let inString = false;
    let close = -1;
    for (let index = open; index < text.length; index += 1) {
      const character = text[index];
      if (character === "'") {
        inString = !inString;
      }
      if (inString) {
        continue;
      }
      if (character === '(') {
        depth += 1;
      } else if (character === ')') {
        depth -= 1;
        if (depth === 0) {
          close = index;
          break;
        }
      }
    }
    if (close === -1) {
      continue;
    }
    const definitions = splitDefinitions(text.slice(open + 1, close))
      .filter(
        (definition) =>
          !/^(CONSTRAINT|PRIMARY\s+KEY|UNIQUE|CHECK|FOREIGN\s+KEY)\b/i.test(definition),
      )
      .map((definition) => {
        const columnMatch = /^([a-z0-9_]+)\s+([\s\S]+)$/i.exec(definition);
        return columnMatch === null
          ? { name: '', type: definition, raw: definition }
          : { name: columnMatch[1], type: columnMatch[2].replace(/\s+/g, ' '), raw: definition };
      });
    tables.push({ name: match[1], index: match.index ?? 0, definitions });
  }
  return tables;
}

/**
 * @param {string} file
 * @param {string} text
 * @param {string} timestamp
 * @param {boolean} isDown
 * @returns {Array<{ file: string, line: number, column: number, message: string }>}
 */
function scanFile(file, text, timestamp, isDown) {
  const findings = [];
  const code = maskUnscannable(text);
  const report = (index, message) => {
    const { line, column } = positionOf(text, index);
    findings.push({ file, line, column, message });
  };

  if (timestamp < WINDOW_START || timestamp > WINDOW_END) {
    report(
      0,
      `timestamp ${timestamp} is outside the step 2 window (${WINDOW_START} to ${WINDOW_END})`,
    );
  }

  const transaction = /\b(BEGIN|COMMIT|ROLLBACK)\s*;/gi;
  for (const match of code.matchAll(transaction)) {
    report(
      match.index ?? 0,
      'the runner owns the transaction; a migration must not open or close one',
    );
  }

  if (isDown || timestamp < STANDARDS_FROM) {
    return findings;
  }

  for (const table of findCreateTables(code)) {
    const byName = new Map(table.definitions.map((definition) => [definition.name, definition]));
    for (const column of UNIVERSAL_COLUMNS) {
      const definition = byName.get(column.name);
      if (definition === undefined) {
        report(
          table.index,
          `table ${table.name} must declare the universal column ${column.name} (${column.expectation})`,
        );
      } else if (!column.matches(definition)) {
        report(
          table.index,
          `table ${table.name} column ${column.name} must be ${column.expectation}`,
        );
      }
    }
  }

  for (const match of code.matchAll(
    /\b(timestamp\s+without\s+time\s+zone|timestamp(?!\s+with))\b/gi,
  )) {
    report(
      match.index ?? 0,
      'a timestamp column must be timestamptz, never timestamp without time zone',
    );
  }

  for (const match of code.matchAll(/\b(money|real|double\s+precision)\b/gi)) {
    report(match.index ?? 0, `the column type ${match[1]} is forbidden; money is numeric(18,4)`);
  }

  for (const match of code.matchAll(/\bnumeric\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/gi)) {
    if (match[1] !== '18' || match[2] !== '4') {
      report(match.index ?? 0, `numeric(${match[1]},${match[2]}) is not numeric(18,4)`);
    }
  }

  for (const match of code.matchAll(/\bREFERENCES\s+[a-z0-9_]+\s*(\([^)]*\))?([^,\n]*)/gi)) {
    if (!/ON\s+DELETE\s+RESTRICT/i.test(match[2] ?? '')) {
      report(match.index ?? 0, 'every foreign key must declare ON DELETE RESTRICT');
    }
  }

  for (const match of code.matchAll(
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-z0-9_]+)\s+ON\s+([a-z0-9_]+)/gi,
  )) {
    const expected = `idx_${match[2]}_`;
    if (!match[1].startsWith(expected)) {
      report(
        match.index ?? 0,
        `index ${match[1]} on ${match[2]} must be named ${expected}{columns}`,
      );
    }
  }

  for (const match of code.matchAll(/CONSTRAINT\s+([a-z0-9_]+)\s+(CHECK|FOREIGN\s+KEY)\b/gi)) {
    const prefix = /CHECK/i.test(match[2]) ? 'chk_' : 'fk_';
    if (!match[1].startsWith(prefix)) {
      report(match.index ?? 0, `constraint ${match[1]} must start with ${prefix}`);
    }
  }

  return findings;
}

function main() {
  const files = listTrackedFiles();
  const findings = [];
  let scannedCount = 0;
  for (const file of files) {
    if (file === SELF || !file.startsWith(MIGRATION_DIRECTORY) || !file.endsWith('.sql')) {
      continue;
    }
    const match = FILE_PATTERN.exec(file);
    if (match === null) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    const isDown = file.endsWith('_down.sql');
    findings.push(...scanFile(file, text, match[1], isDown));
  }
  reportResult(
    'schema-standards',
    findings,
    `${scannedCount} migration files scanned against the universal columns, type, foreign key, index and constraint rules`,
  );
}

main();
