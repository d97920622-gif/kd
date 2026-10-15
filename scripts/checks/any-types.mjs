// path: scripts/checks/any-types.mjs
/**
 * check:any-types -- TypeScript code may never use the any type.
 *
 * The rule is enforced twice on purpose: @typescript-eslint/no-explicit-any
 * fails the lint run, and this check fails the verify run. Comments and
 * string values are stripped first, so documentation that mentions the
 * banned keyword does not produce a false positive.
 */
import {
  findMatches,
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const SELF = 'scripts/checks/any-types.mjs';

const TYPE_PATTERNS = [
  { label: 'type annotation', pattern: /:\s*any\b/g },
  { label: 'type assertion', pattern: /\bas\s+any\b/g },
  { label: 'generic argument', pattern: /<\s*any\s*[>,)]/g },
  { label: 'generic default', pattern: /=\s*any\b/g },
  { label: 'array of any', pattern: /\bany\s*\[\s*\]/g },
  { label: 'parameter typed any', pattern: /\(\s*any\s*[,)]/g },
  { label: 'union with any', pattern: /[|&]\s*any\b/g },
  { label: 'record value any', pattern: /,\s*any\s*>?/g },
];

function isTypeScriptSource(file) {
  return file.endsWith('.ts') || file.endsWith('.tsx');
}

function scanText(file, text) {
  const stripped = stripCommentsAndStrings(text);
  const findings = [];
  for (const entry of TYPE_PATTERNS) {
    for (const match of findMatches(stripped, entry.pattern)) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `any type usage is forbidden (${entry.label})`,
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
    if (file === SELF || !isTypeScriptSource(file)) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    findings.push(...scanText(file, text));
  }
  reportResult('any-types', findings, `${scannedCount} TypeScript files scanned`);
}

main();
