// path: scripts/checks/no-console.mjs
/**
 * check:no-console -- the console object is banned everywhere.
 *
 * All diagnostics go through the structured logger (lib/logger, sub-step
 * 1.8) or process streams in scripts. Comments and string values are
 * stripped before matching so prose that mentions the banned call, like this
 * header, cannot produce a false positive.
 */
import {
  findMatches,
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const SELF = 'scripts/checks/no-console.mjs';
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const CONSOLE_PATTERN = /\bconsole\s*\.\s*[A-Za-z_$]/g;
const DEBUGGER_PATTERN = /\bdebugger\b/g;

function hasSourceExtension(file) {
  return SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension));
}

function scanText(file, text) {
  const stripped = stripCommentsAndStrings(text);
  const findings = [];
  for (const match of findMatches(stripped, CONSOLE_PATTERN)) {
    const { line, column } = positionOf(text, match.index);
    findings.push({
      file,
      line,
      column,
      message: 'console usage is forbidden; use the structured logger',
    });
  }
  for (const match of findMatches(stripped, DEBUGGER_PATTERN)) {
    const { line, column } = positionOf(text, match.index);
    findings.push({ file, line, column, message: 'debugger statement is forbidden' });
  }
  return findings;
}

function main() {
  const files = listTrackedFiles();
  let scannedCount = 0;
  const findings = [];
  for (const file of files) {
    if (file === SELF || !hasSourceExtension(file)) {
      continue;
    }
    const text = readTextFile(file);
    if (text === null) {
      continue;
    }
    scannedCount += 1;
    findings.push(...scanText(file, text));
  }
  reportResult('no-console', findings, `${scannedCount} source files scanned`);
}

main();
