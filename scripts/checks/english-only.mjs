// path: scripts/checks/english-only.mjs
/**
 * check:english-only -- Rule 1 enforcement.
 *
 * Every tracked text file must contain ASCII characters only (0x00 to 0x7F).
 * The single documented exemption is FEATURE_LIST.md, the owner-supplied
 * specification written in Bengali; that exemption is recorded in ADR-0002.
 * Binary assets are skipped by extension or NUL-byte detection.
 */
import { listTrackedFiles, positionOf, readTextFile, reportResult } from './_lib.mjs';

const EXEMPT_FILES = ['FEATURE_LIST.md'];
const MAX_FINDINGS_PER_FILE = 5;

function countNonAscii(text) {
  let count = 0;
  for (const char of text) {
    if (char.codePointAt(0) > 127) {
      count += 1;
    }
  }
  return count;
}

function scanFile(file) {
  const text = readTextFile(file);
  if (text === null) {
    return { findings: [], scanned: false };
  }
  if (countNonAscii(text) === 0) {
    return { findings: [], scanned: true };
  }
  const findings = [];
  for (let index = 0; index < text.length; index += 1) {
    const codePoint = text.codePointAt(index);
    if (codePoint <= 127) {
      continue;
    }
    if (findings.length < MAX_FINDINGS_PER_FILE) {
      const { line, column } = positionOf(text, index);
      const hex = codePoint.toString(16).toUpperCase().padStart(4, '0');
      findings.push({
        file,
        line,
        column,
        message: `non-ASCII character U+${hex} (Rule 1: English only)`,
      });
    }
    if (codePoint > 0xffff) {
      index += 1;
    }
  }
  findings.push({
    file,
    line: 1,
    column: 1,
    message: `file contains non-ASCII characters (first findings listed above)`,
  });
  return { findings, scanned: true };
}

function main() {
  const files = listTrackedFiles();
  const scanned = [];
  const findings = [];
  for (const file of files) {
    if (EXEMPT_FILES.includes(file)) {
      continue;
    }
    const result = scanFile(file);
    if (result.scanned) {
      scanned.push(file);
    }
    findings.push(...result.findings);
  }
  const summary = `${scanned.length} text files scanned, ${EXEMPT_FILES.length} documented exemption`;
  reportResult('english-only', findings, summary);
}

main();
