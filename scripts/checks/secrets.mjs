// path: scripts/checks/secrets.mjs
/**
 * check:secrets -- no credential, key or token may be committed.
 *
 * The check combines high-confidence credential patterns (cloud key
 * prefixes, private key blocks, provider API keys, JSON Web Tokens) with a
 * conservative assignment heuristic for long literal values bound to a
 * secret-like name. Findings never print the matched value; only the file,
 * position and the name of the rule are reported.
 *
 * Safe placeholder values documented in .env.example are short or empty and
 * do not match any pattern.
 */
import { findMatches, listTrackedFiles, positionOf, readTextFile, reportResult } from './_lib.mjs';

const SELF = 'scripts/checks/secrets.mjs';

const VALUE_PATTERNS = [
  { label: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  {
    label: 'private key block',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
  { label: 'live payment secret key', pattern: /\b(?:sk|rk)_live_[0-9A-Za-z]{16,}\b/g },
  { label: 'GitHub token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[0-9A-Za-z]{36}\b/g },
  { label: 'GitHub fine-grained token', pattern: /\bgithub_pat_[0-9A-Za-z_]{22,}\b/g },
  { label: 'Supabase secret key', pattern: /\bsb_secret_[0-9A-Za-z_-]{16,}\b/g },
  {
    label: 'JSON Web Token',
    pattern: /\beyJ[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{8,}\.[0-9A-Za-z_-]{4,}\b/g,
  },
  {
    label: 'literal assigned to a secret-like name',
    pattern:
      /(?:api[_-]?key|secret|password|passwd|client[_-]?secret|access[_-]?key|private[_-]?key)\s*[:=]\s*["'][A-Za-z0-9+/_-]{16,}["']/gi,
  },
];

function scanText(file, text) {
  const findings = [];
  for (const entry of VALUE_PATTERNS) {
    for (const match of findMatches(text, entry.pattern)) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `possible committed secret (${entry.label}); value withheld`,
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
    if (file === SELF) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    findings.push(...scanText(file, text));
  }
  reportResult('secrets', findings, `${scannedCount} text files scanned`);
}

main();
