// path: scripts/checks/no-todo.mjs
/**
 * check:no-todo -- no unfinished-work markers anywhere.
 *
 * Forbidden markers: TODO, FIXME, XXX, HACK (upper case, whole word).
 * The governance corpus (owner specification, plan, README, handoffs)
 * restates these markers while documenting the rule and is exempt; the
 * specification corpus list in _lib.mjs is the exact exemption set.
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

const SELF = 'scripts/checks/no-todo.mjs';
const EXEMPT_FILES = [...SPEC_CORPUS_PATTERNS, SELF];
const MARKER_PATTERN = /\bTODO\b|\bFIXME\b|\bXXX\b|\bHACK\b/g;

function scanText(file, text) {
  return findMatches(text, MARKER_PATTERN).map((match) => {
    const { line, column } = positionOf(text, match.index);
    return {
      file,
      line,
      column,
      message: `unfinished-work marker "${match.text}" is forbidden`,
    };
  });
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
  reportResult('no-todo', findings, `${scannedCount} text files scanned`);
}

main();
