// path: scripts/checks/money-math.mjs
/**
 * check:money-math -- Rule 2 enforcement for monetary values.
 *
 * Money is numeric(18,4) in the database and a decimal.js Decimal value in
 * code. Every monetary calculation goes through lib/utils/currency.ts. This
 * check fails when an identifier that names a monetary value is used with a
 * JavaScript numeric operator, an implicit Number conversion, a Math
 * rounding call or a string concatenation.
 *
 * The identifier heuristic is deliberately conservative: names that carry a
 * counting or paging word (count, items, limit, page, size and similar) are
 * treated as measurements, not money, so "paymentCount + 1" is not a
 * finding while "paymentAmount + 1" is. The exempt module is the single
 * sanctioned money implementation.
 */
import {
  findMatches,
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const SELF = 'scripts/checks/money-math.mjs';
const EXEMPT_FILES = [SELF, 'lib/utils/currency.ts'];

const MONEY_WORDS =
  'amount|total|price|cost|fee|balance|subtotal|tax|discount|revenue|payout|salary|wage|earning|money|usd|payment|credit|debit|rate';
const NON_MONEY_WORDS =
  'count|qty|quantity|items|length|index|page|days|hours|minutes|seconds|attempts|retries|limit|links|files|routes|lines|findings|matches|checks|errors|chars|bytes|rows|size';

const IDENTIFIER = `[A-Za-z_$][A-Za-z0-9_$]*`;
// A monetary identifier: contains a money word and no counting word anywhere.
const MONEY_NAME = `(?=[A-Za-z0-9_$]*(?:${MONEY_WORDS}))(?![A-Za-z0-9_$]*(?:${NON_MONEY_WORDS}))${IDENTIFIER}`;

const ARITHMETIC_OPERATORS = '[-+*/%]';

const RULES = [
  {
    label: 'arithmetic on a money value',
    pattern: new RegExp(
      `\\b${MONEY_NAME}\\s*${ARITHMETIC_OPERATORS}=?|${ARITHMETIC_OPERATORS}\\s*\\b${MONEY_NAME}`,
      'gi',
    ),
  },
  {
    label: 'implicit Number conversion of a money value',
    pattern: new RegExp(`\\b(?:Number|parseFloat|parseInt)\\s*\\([^)]*\\b${MONEY_NAME}`, 'gi'),
  },
  {
    label: 'Math rounding of a money value',
    pattern: new RegExp(
      `\\bMath\\.(?:round|floor|ceil|abs|min|max|pow|trunc|sign)\\s*\\([^)]*\\b${MONEY_NAME}`,
      'gi',
    ),
  },
  {
    label: 'fixed point formatting of a money value',
    pattern: new RegExp(`\\b${MONEY_NAME}\\s*\\.\\s*(?:toFixed|toPrecision)\\s*\\(`, 'gi'),
  },
];

function isScript(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

function scanText(file, text) {
  const stripped = stripCommentsAndStrings(text);
  const findings = [];
  for (const rule of RULES) {
    for (const match of findMatches(stripped, rule.pattern)) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `${rule.label} is forbidden (Rule 2: use decimal.js via lib/utils/currency.ts)`,
      });
    }
  }
  return findings;
}

function main() {
  const files = listTrackedFiles();
  let scannedCount = 0;
  const findings = [];
  for (const file of files) {
    if (EXEMPT_FILES.includes(file) || !isScript(file)) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    findings.push(...scanText(file, text));
  }
  reportResult('money-math', findings, `${scannedCount} script files scanned`);
}

main();
