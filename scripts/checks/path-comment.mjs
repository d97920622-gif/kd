// path: scripts/checks/path-comment.mjs
/**
 * check:path-comment -- every source file starts with its repository path.
 *
 * Accepted header forms, matched to the file type:
 *   // path: <relative path>       TypeScript, JavaScript, Markdown
 *   #  path: <relative path>       shell, YAML, TOML, container ignore files
 *   /* path: <relative path> *\/   CSS
 *   -- path: <relative path>       SQL
 *   <!-- path: <relative path> --> HTML, SVG
 *
 * A shebang line may precede the header. The declared path must equal the
 * real repository path, so a copy-pasted file cannot keep a stale header.
 * Owner-supplied files, generated files and files without a comment syntax
 * (JSON, lockfiles, LICENSE, binaries) are exempt and listed below.
 */
import { extname } from 'node:path';

import { listTrackedFiles, readTextFile, reportResult } from './_lib.mjs';

const SLASH_COMMENT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.md',
  '.mdx',
]);

const HASH_COMMENT_EXTENSIONS = new Set(['.sh', '.bash', '.yml', '.yaml', '.toml', '.txt', '.env']);

const HASH_COMMENT_FILES = new Set([
  '.gitignore',
  '.prettierignore',
  '.eslintignore',
  '.dockerignore',
  'CODEOWNERS',
  '.env.example',
]);

const BLOCK_COMMENT_EXTENSIONS = new Set(['.css']);
const SQL_COMMENT_EXTENSIONS = new Set(['.sql']);
const XML_COMMENT_EXTENSIONS = new Set(['.html', '.svg']);

const EXEMPT_FILES = new Set([
  'FEATURE_LIST.md',
  'MASTER_PROMPT.md',
  'LICENSE',
  'package-lock.json',
  'next-env.d.ts',
  '.prettierrc',
  '.eslintrc.json',
  'tsconfig.json',
  'components.json',
  'package.json',
]);

const EXEMPT_EXTENSIONS = new Set(['.json', '.webmanifest', '.lock', '.db', '.sqlite', '.csv']);

function headerFor(file) {
  const base = file.split('/').pop() ?? file;
  const extension = extname(base).toLowerCase();
  if (EXEMPT_FILES.has(file) || EXEMPT_FILES.has(base) || EXEMPT_EXTENSIONS.has(extension)) {
    return { kind: 'exempt' };
  }
  if (SLASH_COMMENT_EXTENSIONS.has(extension)) {
    return { kind: 'line', prefix: '// path:', expected: `// path: ${file}` };
  }
  if (HASH_COMMENT_EXTENSIONS.has(extension) || HASH_COMMENT_FILES.has(base)) {
    return { kind: 'line', prefix: '# path:', expected: `# path: ${file}` };
  }
  if (BLOCK_COMMENT_EXTENSIONS.has(extension)) {
    return { kind: 'line', prefix: '/* path:', expected: `/* path: ${file} */` };
  }
  if (SQL_COMMENT_EXTENSIONS.has(extension)) {
    return { kind: 'line', prefix: '-- path:', expected: `-- path: ${file}` };
  }
  if (XML_COMMENT_EXTENSIONS.has(extension)) {
    return { kind: 'line', prefix: '<!-- path:', expected: `<!-- path: ${file} -->` };
  }
  if (extension === '') {
    return { kind: 'shebang' };
  }
  return { kind: 'exempt' };
}

function firstMeaningfulLines(text) {
  const lines = text.split('\n');
  const first = (lines[0] ?? '').trim();
  const second = (lines[1] ?? '').trim();
  if (first.startsWith('#!')) {
    return { header: second, lineNumber: 2, firstLine: first };
  }
  return { header: first, lineNumber: 1, firstLine: first };
}

function checkFile(file) {
  const header = headerFor(file);
  if (header.kind === 'exempt') {
    return { finding: null, checked: false };
  }
  const text = readTextFile(file);
  if (text === null) {
    return { finding: null, checked: false };
  }
  const { header: headerLine, lineNumber, firstLine } = firstMeaningfulLines(text);
  if (header.kind === 'shebang') {
    if (!firstLine.startsWith('#!') || !headerLine.startsWith('# path:')) {
      return {
        finding: {
          file,
          line: 1,
          column: 1,
          message: `executable script file requires "# path: ${file}" on the line after the shebang`,
        },
        checked: true,
      };
    }
    const shebangDeclared = headerLine.replace(/^\s*#\s*path:\s*/, '').trim();
    if (shebangDeclared !== file) {
      return {
        finding: {
          file,
          line: lineNumber,
          column: 1,
          message: `path comment says "${shebangDeclared}" but the file is "${file}"`,
        },
        checked: true,
      };
    }
    return { finding: null, checked: true };
  }
  if (!headerLine.startsWith(header.prefix)) {
    return {
      finding: {
        file,
        line: lineNumber,
        column: 1,
        message: `missing or misplaced path comment; expected: ${header.expected}`,
      },
      checked: true,
    };
  }
  const declaredPath = headerLine
    .replace(/^\s*\/\*/, '')
    .replace(/^\s*<!--/, '')
    .replace(/^\s*\/\//, '')
    .replace(/^\s*#/, '')
    .replace(/^\s*--/, '')
    .replace(/^\s*path:\s*/, '')
    .replace(/\s*\*\/\s*$/, '')
    .replace(/\s*-->\s*$/, '')
    .trim();
  if (header.kind === 'shebang') {
    return { finding: null, checked: true };
  }
  if (declaredPath !== file) {
    return {
      finding: {
        file,
        line: lineNumber,
        column: 1,
        message: `path comment says "${declaredPath}" but the file is "${file}"`,
      },
      checked: true,
    };
  }
  return { finding: null, checked: true };
}

function main() {
  const files = listTrackedFiles();
  const findings = [];
  let checkedCount = 0;
  for (const file of files) {
    const { finding, checked } = checkFile(file);
    if (checked) {
      checkedCount += 1;
    }
    if (finding !== null) {
      findings.push(finding);
    }
  }
  reportResult('path-comment', findings, `${checkedCount} source files carry a valid path comment`);
}

main();
