// path: scripts/checks/rls-coverage.mjs
/**
 * check:rls-coverage -- every table is closed by default, and every policy is narrow.
 *
 * The live catalogue is the authority (scripts/db/sql/check-rls-coverage.sql
 * runs against a database in the CI database job). `npm run verify` has no
 * database, so this check reads the migration files and enforces what text can
 * prove, before a commit exists:
 *
 *   1. every table created by an up migration has ENABLE and FORCE ROW LEVEL
 *      SECURITY in an up migration, so the owner is subject to the policies;
 *   2. every such table has at least one policy, so a new table is closed until
 *      a policy opens it;
 *   3. every policy names a table that is created, and is granted TO kd_app and
 *      to no other role; nothing is granted to PUBLIC;
 *   4. no policy is USING (true) or WITH CHECK (true);
 *   5. no up migration disables or un-forces row level security, grants DELETE,
 *      grants to a role other than kd_app, or creates a BYPASSRLS role.
 *
 * Comments and string literals are masked first, so prose such as "CREATE
 * TABLE" in a header comment is never read as a statement.
 */
import { listTrackedFiles, positionOf, readTextFile, reportResult } from './_lib.mjs';

const UP_MIGRATION_PATTERN = /^migrations\/\d{14}_[a-z0-9]+(?:_[a-z0-9]+)*\.sql$/;
const DOWN_SUFFIX = '_down.sql';
const APPLICATION_ROLE = 'kd_app';
const NAME = '[a-z_][a-z0-9_]*';

/**
 * Replace comments and string literals with spaces, keeping every newline and
 * every offset, so a match points at the line a reader can open.
 * @param {string} text
 * @returns {string}
 */
function maskSql(text) {
  const output = text.split('');
  let index = 0;
  while (index < text.length) {
    const character = text[index];
    const next = text[index + 1];
    if (character === '-' && next === '-') {
      const end = text.indexOf('\n', index);
      const stop = end === -1 ? text.length : end;
      blank(output, index, stop);
      index = stop;
    } else if (character === '/' && next === '*') {
      const end = text.indexOf('*/', index + 2);
      const stop = end === -1 ? text.length : end + 2;
      blank(output, index, stop);
      index = stop;
    } else if (character === "'") {
      const stop = endOfString(text, index);
      blank(output, index + 1, stop - 1);
      index = stop;
    } else {
      index += 1;
    }
  }
  return output.join('');
}

/** Index just past the closing quote of the literal that opens at `start`. */
function endOfString(text, start) {
  let index = start + 1;
  while (index < text.length) {
    if (text[index] === "'") {
      if (text[index + 1] === "'") {
        index += 2;
        continue;
      }
      return index + 1;
    }
    index += 1;
  }
  return text.length;
}

/** Blank a range in place, keeping newlines. */
function blank(output, from, to) {
  for (let index = from; index < to; index += 1) {
    if (output[index] !== '\n') {
      output[index] = ' ';
    }
  }
}

/**
 * Every match of a global pattern with its character offset.
 * @param {string} source
 * @param {RegExp} pattern
 */
function allMatches(source, pattern) {
  const found = [];
  for (const match of source.matchAll(pattern)) {
    found.push({ match, offset: match.index ?? 0 });
  }
  return found;
}

function main() {
  const files = listTrackedFiles()
    .filter((file) => UP_MIGRATION_PATTERN.test(file) && !file.endsWith(DOWN_SUFFIX))
    .sort();

  const findings = [];
  const tables = new Map();
  const enabled = new Set();
  const forced = new Set();
  const policyTables = new Map();
  const policyTargets = [];
  let policyCount = 0;

  for (const file of files) {
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    const masked = maskSql(text);
    const report = (offset, message) => {
      const { line, column } = positionOf(text, offset);
      findings.push({ file, line, column, message });
    };

    for (const { match, offset } of allMatches(
      masked,
      new RegExp(`\\bCREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:public\\.)?(${NAME})`, 'gi'),
    )) {
      tables.set(match[1].toLowerCase(), { file, offset, text });
    }

    for (const { match } of allMatches(
      masked,
      new RegExp(
        `\\bALTER\\s+TABLE\\s+(?:ONLY\\s+)?(?:public\\.)?(${NAME})\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY\\b`,
        'gi',
      ),
    )) {
      enabled.add(match[1].toLowerCase());
    }

    for (const { match } of allMatches(
      masked,
      new RegExp(
        `\\bALTER\\s+TABLE\\s+(?:ONLY\\s+)?(?:public\\.)?(${NAME})\\s+FORCE\\s+ROW\\s+LEVEL\\s+SECURITY\\b`,
        'gi',
      ),
    )) {
      forced.add(match[1].toLowerCase());
    }

    for (const { offset } of allMatches(
      masked,
      /\bALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?[a-z_][a-z0-9_]*\s+(?:NO\s+FORCE|DISABLE)\s+ROW\s+LEVEL\s+SECURITY\b/gi,
    )) {
      report(offset, 'row level security is disabled or un-forced in an up migration');
    }

    for (const { match, offset } of allMatches(
      masked,
      new RegExp(`\\bCREATE\\s+POLICY\\s+(${NAME})\\s+ON\\s+(?:public\\.)?(${NAME})([^;]*);`, 'gi'),
    )) {
      policyCount += 1;
      const table = match[2].toLowerCase();
      const body = match[3];
      policyTargets.push({ table, file, offset, text });
      policyTables.set(table, (policyTables.get(table) ?? 0) + 1);
      const roleClause = /\bTO\s+([a-z_][a-z0-9_]*(?:\s*,\s*[a-z_][a-z0-9_]*)*)/i.exec(body);
      if (roleClause === null) {
        report(offset, `policy ${match[1]} has no TO clause, so it defaults to PUBLIC`);
      } else if (roleClause[1].trim().toLowerCase() !== APPLICATION_ROLE) {
        report(
          offset,
          `policy ${match[1]} is granted to ${roleClause[1].trim()}, not to ${APPLICATION_ROLE} alone`,
        );
      }
      if (/\bUSING\s*\(\s*true\s*\)/i.test(body) || /\bWITH\s+CHECK\s*\(\s*true\s*\)/i.test(body)) {
        report(offset, `policy ${match[1]} is open: USING (true) or WITH CHECK (true)`);
      }
    }

    for (const { match, offset } of allMatches(masked, /[^;]+;?/g)) {
      const statement = match[0];
      if (/^\s*GRANT\b/i.test(statement)) {
        if (/\bDELETE\b/i.test(statement)) {
          report(offset, 'a migration grants DELETE; rows are removed by setting deleted_at');
        }
        const grantee = /\bTO\s+([a-z_][a-z0-9_]*)/i.exec(statement);
        if (grantee !== null && grantee[1].toLowerCase() !== APPLICATION_ROLE) {
          report(
            offset,
            `a migration grants to ${grantee[1]}; only ${APPLICATION_ROLE} may be granted`,
          );
        }
      }
      if (/\bBYPASSRLS\b/i.test(statement)) {
        report(
          offset,
          'a migration creates or alters a role with BYPASSRLS, which removes every policy for it',
        );
      }
    }
  }

  for (const [name, table] of tables) {
    const location = positionOf(table.text, table.offset);
    const report = (message) =>
      findings.push({
        file: table.file,
        line: location.line,
        column: location.column,
        message: `${name}: ${message}`,
      });
    if (!enabled.has(name)) {
      report('row level security is not enabled in an up migration');
    }
    if (!forced.has(name)) {
      report('FORCE ROW LEVEL SECURITY is not set in an up migration');
    }
    if (!policyTables.has(name)) {
      report('no policy is created, so the table is closed to every role');
    }
  }

  for (const target of policyTargets) {
    if (!tables.has(target.table)) {
      const { line, column } = positionOf(target.text, target.offset);
      findings.push({
        file: target.file,
        line,
        column,
        message: `policy targets ${target.table}, which no up migration creates`,
      });
    }
  }

  reportResult(
    'rls-coverage',
    findings,
    `${tables.size} tables, ${forced.size} forced, ${policyCount} policies, every policy TO ${APPLICATION_ROLE} alone, none open, no DELETE grant`,
  );
}

main();
