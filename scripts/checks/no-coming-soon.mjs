// path: scripts/checks/no-coming-soon.mjs
/**
 * check:no-coming-soon -- zero placeholder and unfinished-product wording.
 *
 * Forbidden wording: unfinished-launch phrases, filler text and dummy
 * content markers. The governance corpus restates the rule and is exempt;
 * the exact exemption set is SPEC_CORPUS_PATTERNS in _lib.mjs.
 */
import {
  findMatches,
  listTrackedFiles,
  matchesAny,
  positionOf,
  readTextFile,
  reportResult,
  SPEC_CORPUS_PATTERNS,
} from './_lib.mjs';

const SELF = 'scripts/checks/no-coming-soon.mjs';
const EXEMPT_FILES = [...SPEC_CORPUS_PATTERNS, SELF];

const FORBIDDEN_PATTERNS = [
  { label: 'unfinished-launch phrase', pattern: /coming\s+soon/gi },
  { label: 'filler text', pattern: /lorem\s+ipsum/gi },
  { label: 'unfinished-build phrase', pattern: /under\s+construction/gi },
  { label: 'unfinished-launch phrase', pattern: /stay\s+tuned/gi },
  { label: 'unfinished-build phrase', pattern: /work\s+in\s+progress/gi },
  { label: 'filler text', pattern: /placeholder\s+text/gi },
  { label: 'dummy content', pattern: /dummy\s+(text|content|data)/gi },
];

function scanText(file, text) {
  const findings = [];
  for (const entry of FORBIDDEN_PATTERNS) {
    for (const match of findMatches(text, entry.pattern)) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `${entry.label} is forbidden: "${match.text}"`,
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
    if (matchesAny(file, EXEMPT_FILES)) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    findings.push(...scanText(file, text));
  }
  reportResult('no-coming-soon', findings, `${scannedCount} text files scanned`);
}

main();
