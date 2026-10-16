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
 * finding while "paymentAmount + 1" is.
 *
 * Sanctioned module: exactly one file implements money arithmetic and must
 * carry the annotation line "money-math-guard: sanctioned". The annotation is
 * checked in both directions, so it is not an escape hatch:
 *   - a sanctioned path without the annotation fails the check;
 *   - the annotation in any other file fails the check.
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
const EXEMPT_FILES = [SELF];

/** The single file allowed to perform monetary arithmetic (Rule 2). */
const SANCTIONED_FILES = ['lib/utils/currency.ts'];

/** Exact annotation line a sanctioned module must carry. */
const SANCTIONED_ANNOTATION = 'money-math-guard: sanctioned';

const MONEY_WORDS =
  'amount|total|price|cost|fee|balance|subtotal|tax|discount|revenue|payout|salary|wage|earning|money|usd|payment|credit|debit|rate';
const NON_MONEY_WORDS =
  'count|qty|quantity|items|length|index|page|days|hours|minutes|seconds|attempts|retries|limit|links|files|routes|lines|findings|matches|checks|errors|chars|bytes|rows|size';

const IDENTIFIER = `[A-Za-z_$][A-Za-z0-9_$]*`;
// A monetary identifier: contains a money word and no counting word anywhere.
const MONEY_NAME = `(?=[A-Za-z0-9_$]*(?:${MONEY_WORDS}))(?![A-Za-z0-9_$]*(?:${NON_MONEY_WORDS}))${IDENTIFIER}`;

/**
 * An operator character that is really arithmetic.
 *
 * A slash in JSX is punctuation, not division: `<ShowcaseFeedback />` and
 * `</ShowcaseFeedback>` both put a slash next to a tag name, and a tag name
 * that happens to contain a money word ("Feedback" carries "fee") would
 * otherwise be read as a division by the identifier. The lookarounds exclude
 * the self-closing and closing forms and leave `{total / 2}` reported.
 */
const ARITHMETIC_OPERATORS = '(?:[-+*%]|(?<!<)/(?!>))';

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
  {
    // A money variable assigned from an expression that uses a JavaScript
    // operator. The sanctioned module has no such expression, because the
    // Decimal API carries the arithmetic in named methods.
    label: 'arithmetic in a money assignment',
    pattern: new RegExp(`\\b${MONEY_NAME}\\s*=(?!=)[^=\\n]*[-+*/%]`, 'gi'),
  },
];

function isScript(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

function annotationFindings(file, text) {
  const declared = text.includes(SANCTIONED_ANNOTATION);
  const sanctioned = SANCTIONED_FILES.includes(file);
  if (sanctioned && !declared) {
    return [
      {
        file,
        line: 1,
        column: 1,
        message: `sanctioned money module must carry the annotation "${SANCTIONED_ANNOTATION}"`,
      },
    ];
  }
  if (!sanctioned && declared) {
    return [
      {
        file,
        line: 1,
        column: 1,
        message: `the "${SANCTIONED_ANNOTATION}" annotation is only permitted in the sanctioned money module`,
      },
    ];
  }
  return [];
}

function scanText(file, text) {
  const findings = annotationFindings(file, text);
  if (SANCTIONED_FILES.includes(file)) {
    return findings;
  }
  const stripped = stripCommentsAndStrings(text);
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
    // The sanctioned module is scanned for its annotation, not for arithmetic.
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
