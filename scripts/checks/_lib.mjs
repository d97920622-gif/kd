// path: scripts/checks/_lib.mjs
/**
 * Shared helpers for the KD SOLUTION IT repository checks.
 *
 * Every check script:
 *   - scans only git-tracked files, so build output and node_modules can
 *     never cause a false positive or a false negative;
 *   - prints findings as path:line:column: message;
 *   - exits with code 0 on success and code 1 on any finding, which keeps
 *     the aggregate verify runner and CI exit codes meaningful.
 *
 * Output uses process.stdout.write and process.stderr.write on purpose:
 * the platform bans the console object everywhere, scripts included.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';

export const REPO_ROOT = process.cwd();

/** Extensions that are binary and never scanned for text patterns. */
export const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.icns',
  '.webp',
  '.avif',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.pdf',
  '.zip',
  '.gz',
  '.tgz',
  '.mp3',
  '.mp4',
  '.wav',
  '.mov',
  '.xlsx',
  '.docx',
]);

/**
 * The owner-supplied specification and the governance corpus restate the
 * prohibited phrases and brand names while documenting the rules themselves.
 * They are the only documented exemption for content-pattern checks.
 * The English-only rule has a narrower exemption: FEATURE_LIST.md alone.
 */
export const SPEC_CORPUS_PATTERNS = [
  'FEATURE_LIST.md',
  'MASTER_PROMPT.md',
  'README.md',
  /^docs\/PLAN\//,
  /^docs\/handoffs\//,
];

/** Mandatory script header keyword, used by the path-comment check. */
export const PATH_COMMENT_KEYWORD = 'path:';

/**
 * All repository files a check should scan: tracked files plus untracked
 * files that are not ignored. Including untracked files means a brand-new
 * file is checked before it is ever committed, so a problem cannot reach a
 * commit that the pre-commit hook would have caught anyway. Ignored paths
 * (node_modules, .next, build output, .env) never appear.
 */
export function listTrackedFiles() {
  const output = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    },
  );
  const seen = new Set();
  for (const entry of output.split('\0')) {
    if (entry.length > 0) {
      seen.add(entry);
    }
  }
  return [...seen];
}

export function matchesAny(file, patterns) {
  return patterns.some((pattern) =>
    pattern instanceof RegExp ? pattern.test(file) : pattern === file,
  );
}

export function isBinaryPath(file) {
  return BINARY_EXTENSIONS.has(extname(file).toLowerCase());
}

/**
 * Read a tracked file as UTF-8 text.
 * Returns null for binary content (extension match or NUL byte) so callers
 * skip it instead of reporting noise.
 */
export function readTextFile(file) {
  if (isBinaryPath(file)) {
    return null;
  }
  let buffer;
  try {
    buffer = readFileSync(join(REPO_ROOT, file));
  } catch {
    return null;
  }
  if (buffer.includes(0)) {
    return null;
  }
  return buffer.toString('utf8');
}

/** Blank a character range while preserving line and column positions. */
export function blankRange(source, out, from, to) {
  for (let index = from; index < to && index < source.length; index += 1) {
    if (source[index] !== '\n') {
      out[index] = ' ';
    }
  }
}

const REGEX_PREFIX_CHARS = '(,=:[!&|?{};+-*%~^<>';

function scanQuoted(source, start, quote) {
  let index = start + 1;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === quote) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

function scanRegexLiteral(source, start) {
  let index = start + 1;
  let inClass = false;
  while (index < source.length) {
    const char = source[index];
    if (char === '\\') {
      index += 2;
      continue;
    }
    if (char === '\n') {
      return start + 1;
    }
    if (char === '[') {
      inClass = true;
    } else if (char === ']') {
      inClass = false;
    } else if (char === '/' && !inClass) {
      return index + 1;
    }
    index += 1;
  }
  return source.length;
}

/**
 * Replace comment, string, template and regex-literal content with spaces
 * while keeping every newline, so line and column numbers stay accurate.
 * Used by checks that must not match words inside prose or string values.
 */
export function stripCommentsAndStrings(source) {
  const out = source.split('');
  let index = 0;
  let previousSignificant = '';
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    if (char === '/' && next === '/') {
      const end = source.indexOf('\n', index);
      const stop = end === -1 ? source.length : end;
      blankRange(source, out, index, stop);
      index = stop;
      continue;
    }
    if (char === '/' && next === '*') {
      const end = source.indexOf('*/', index + 2);
      const stop = end === -1 ? source.length : end + 2;
      blankRange(source, out, index, stop);
      index = stop;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      const stop = scanQuoted(source, index, char);
      blankRange(source, out, index, stop);
      index = stop;
      previousSignificant = char;
      continue;
    }
    if (char === '/' && REGEX_PREFIX_CHARS.includes(previousSignificant)) {
      const stop = scanRegexLiteral(source, index);
      blankRange(source, out, index, stop);
      index = stop;
      continue;
    }
    if (!/\s/.test(char)) {
      previousSignificant = char;
    }
    index += 1;
  }
  return out.join('');
}

/** Line and column (1-based) of a character offset. */
export function positionOf(source, offset) {
  let line = 1;
  let lineStart = 0;
  for (let index = 0; index < offset && index < source.length; index += 1) {
    if (source[index] === '\n') {
      line += 1;
      lineStart = index + 1;
    }
  }
  return { line, column: offset - lineStart + 1 };
}

/**
 * Print the outcome of one check and set the process exit code.
 * findings: array of { file, line, column, message }
 */
export function reportResult(checkName, findings, successSummary) {
  const list = findings.slice();
  if (list.length === 0) {
    process.stdout.write(`check:${checkName} PASS (${successSummary})\n`);
    return;
  }
  const limit = 50;
  for (const finding of list.slice(0, limit)) {
    process.stdout.write(`${finding.file}:${finding.line}:${finding.column}: ${finding.message}\n`);
  }
  if (list.length > limit) {
    process.stdout.write(`... ${list.length - limit} more findings suppressed\n`);
  }
  process.stderr.write(`check:${checkName} FAIL (${list.length} findings)\n`);
  process.exitCode = 1;
}

/**
 * Collect every match of a global regex with position information.
 * Capture groups are returned in `groups`, so callers can extract values.
 */
export function findMatches(source, pattern) {
  const results = [];
  pattern.lastIndex = 0;
  let match = pattern.exec(source);
  while (match !== null) {
    results.push({ text: match[0], index: match.index, groups: match.slice(1) });
    if (match[0].length === 0) {
      pattern.lastIndex += 1;
    }
    match = pattern.exec(source);
  }
  return results;
}

/**
 * Parse a stylesheet into flat declarations with their nesting path.
 *
 * Returns one record per declaration: { path, property, value }, where path
 * is the stack of block preludes that contain it, for example
 * ['@layer base', '@media (prefers-contrast: more)', ':root'].
 *
 * The parser is deliberately small: comments are skipped, at-rules without a
 * block are ignored, and nested blocks are tracked by brace depth. It is
 * enough for the hand-written stylesheets in this repository and it keeps the
 * checks independent of a CSS toolchain.
 */
export function parseCssDeclarations(text) {
  const records = [];
  const stack = [];
  let buffer = '';
  let inComment = false;
  let index = 0;
  while (index < text.length) {
    const character = text[index];
    if (inComment) {
      if (character === '*' && text[index + 1] === '/') {
        inComment = false;
        index += 2;
        continue;
      }
      index += 1;
      continue;
    }
    if (character === '/' && text[index + 1] === '*') {
      inComment = true;
      index += 2;
      continue;
    }
    if (character === '{') {
      stack.push(buffer.trim());
      buffer = '';
      index += 1;
      continue;
    }
    if (character === '}') {
      stack.pop();
      buffer = '';
      index += 1;
      continue;
    }
    if (character === ';') {
      const statement = buffer.trim();
      buffer = '';
      if (statement.length > 0 && stack.length > 0 && !statement.startsWith('@')) {
        const separator = statement.indexOf(':');
        if (separator > 0) {
          records.push({
            path: [...stack],
            property: statement.slice(0, separator).trim(),
            value: statement.slice(separator + 1).trim(),
          });
        }
      }
      index += 1;
      continue;
    }
    buffer += character;
    index += 1;
  }
  return records;
}

/**
 * Select the declarations of one block. `selector` must be the last prelude
 * of the block path, and `media` either a substring that must appear in the
 * path or null when the block must not be inside any @media at all.
 * Returns a Map of property to value.
 */
export function selectCssBlock(records, { selector, media = null }) {
  const wantedSelector = normalizeCssText(selector);
  const wantedMedia = media === null ? null : normalizeCssText(media);
  const result = new Map();
  for (const record of records) {
    if (normalizeCssText(record.path[record.path.length - 1]) !== wantedSelector) {
      continue;
    }
    const insideMedia = record.path.some((entry) => entry.startsWith('@media'));
    if (wantedMedia === null && insideMedia) {
      continue;
    }
    if (
      wantedMedia !== null &&
      !record.path.some((entry) => normalizeCssText(entry).includes(wantedMedia))
    ) {
      continue;
    }
    result.set(record.property, record.value);
  }
  return result;
}

/** Collapse whitespace so a selector spanning several lines still matches. */
export function normalizeCssText(value) {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * True when the stylesheet contains a block whose prelude matches the given
 * at-rule substring, for example '@media (forced-colors: active)'. Returns
 * the declarations of that block, so a caller can assert its content.
 */
export function selectCssAtRuleBlock(records, atRuleSubstring) {
  return records.filter((record) =>
    record.path.some((entry) => entry.startsWith('@media') && entry.includes(atRuleSubstring)),
  );
}
