// path: scripts/checks/forbidden-brands.mjs
/**
 * check:forbidden-brands -- Rule 5 enforcement.
 *
 * Payment partner brand names from Rule 5 must never appear in code, UI
 * text, seeds, documentation or configuration. Use "Global Payout Partners"
 * for payouts and "Local Payment Methods via Licensed Partners" for
 * collection. The governance corpus that restates the rule is exempt
 * (SPEC_CORPUS_PATTERNS in _lib.mjs) and so is this file, whose pattern
 * list is the rule itself.
 *
 * Findings are reported by location only; the matched token is not printed,
 * so a run log can never become a source of the brand names.
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

const SELF = 'scripts/checks/forbidden-brands.mjs';
const EXEMPT_FILES = [...SPEC_CORPUS_PATTERNS, SELF];

// Assembled from fragments so that this file's own pattern list does not
// have to be exempted for the English-only checker either.
const BRAND_TOKENS = [
  'b' + 'kash',
  'na' + 'gad',
  'g' + 'cash',
  'prompt' + 'pay',
  'pay' + 'now',
  'u' + 'pi',
  'ali' + 'pay',
  'we' + 'chat',
  'duit' + 'now',
  'mo' + 'mo',
  'o' + 'vo',
  'go' + 'pay',
  'pay' + 'pay',
  'kakao' + 'pay',
  'grab' + 'pay',
  'true' + 'money',
  'da' + 'na',
  'bo' + 'ost',
];

const BRAND_PATTERNS = BRAND_TOKENS.map((token) => {
  const source = token === 'wechat' ? `${token}(\\s+pay)?` : token;
  return { label: token, pattern: new RegExp(`\\b${source}\\b`, 'gi') };
});

function scanText(file, text) {
  const findings = [];
  for (const entry of BRAND_PATTERNS) {
    for (const match of findMatches(text, entry.pattern)) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message:
          'forbidden payment brand reference (Rule 5); use "Global Payout Partners" or ' +
          '"Local Payment Methods via Licensed Partners"',
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
  reportResult('forbidden-brands', findings, `${scannedCount} text files scanned`);
}

main();
