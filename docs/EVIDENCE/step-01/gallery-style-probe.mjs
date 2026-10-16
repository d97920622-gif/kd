// path: docs/EVIDENCE/step-01/gallery-style-probe.mjs
/**
 * Segment gate evidence for 1B, part one: the styling half of
 *
 *   "no hardcoded color or spacing value exists outside tokens".
 *
 * This file is evidence, not part of the product and not a test. It is run by
 * hand when a gate has to be proven; docs/PLAN/04_DEFINITION_OF_DONE_AND_GATES
 * section 4 allows evidence to live in a file under docs/EVIDENCE/. The
 * project ships no test files (Rule 4), so nothing here is wired into
 * `npm run verify`: the gate is proven by running the command and recording
 * the output in docs/EVIDENCE/step-01/gate-1B.md.
 *
 * Four things are checked, in order:
 *
 *   1. Every class token used by the application tree compiles to CSS. Tailwind
 *      ignores an unknown class silently, so "no CSS produced" is the only
 *      reliable signal that a class name is a typo, a step that is not in the
 *      scale, or a width the token layer does not offer.
 *   2. Negative controls: the numeric steps this project replaced compile to
 *      nothing, so a component that used one would silently lose its spacing.
 *   3. The declarations the design system depends on, by selector.
 *   4. An independent sweep for raw values: no hex, rgb() or hsl() colour
 *      literal and no inline style attribute may exist in app/, components/ or
 *      lib/. The token definition files (styles/globals.css,
 *      config/design-tokens.ts, tailwind.config.ts) are the sanctioned places
 *      for literals and are excluded by design.
 *
 * The page path contains parentheses (app/(dev)/...), which a glob reads as an
 * extglob, so the tokens are collected from source and handed to the Tailwind
 * CLI as one generated content file instead of as a glob.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, resolved from this file so the probe runs from anywhere. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const require = createRequire(join(ROOT, 'package.json'));
const ts = require('typescript');

/** Temporary output; the probe writes outside the repository on purpose. */
const TMP_DIRECTORY = '/tmp/kd-evidence';

const CLASS_HELPERS = new Set(['cn', 'cva', 'clsx', 'twMerge']);

/**
 * Utilities that are a single word. Every other token has to contain a hyphen,
 * which is how a stray identifier is kept out of the class list.
 */
const SINGLE_WORD_UTILITIES = new Set([
  'absolute',
  'antialiased',
  'block',
  'contents',
  'fixed',
  'flex',
  'grid',
  'hidden',
  'inline',
  'inline-flex',
  'relative',
  'static',
  'sticky',
  'table',
  'truncate',
  'underline',
  'visible',
]);

/** Numeric steps this project replaced with its own spacing scale. */
const NEGATIVE_CONTROLS = ['w-72', 'w-40', 'min-w-40', 'max-w-64', 'gap-72', 'mt-72'];

/** Files allowed to contain raw values, because they define the tokens. */
const TOKEN_DEFINITION_FILES = [
  'styles/globals.css',
  'config/design-tokens.ts',
  'config/design-tokens.json',
  'tailwind.config.ts',
  'scripts/export-design-tokens.ts',
  'scripts/checks/design-tokens.mjs',
  'package-lock.json',
];

function walk(directory) {
  const entries = readdirSync(join(ROOT, directory)).sort();
  const files = [];
  for (const entry of entries) {
    const relative = `${directory}/${entry}`;
    if (statSync(join(ROOT, relative)).isDirectory()) {
      files.push(...walk(relative));
    } else if (/\.(tsx|ts|css)$/.test(relative)) {
      files.push(relative);
    }
  }
  return files;
}

function unwrap(node) {
  let current = node;
  while (
    current !== undefined &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

const collected = [];

function collect(expression, sourceFile) {
  const value = unwrap(expression);
  if (value === undefined) {
    return;
  }
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    collected.push({ file: sourceFile.fileName, text: value.text });
    return;
  }
  if (ts.isTemplateExpression(value)) {
    // Every literal part of the template, not only the head. A class that
    // arrives through an interpolation (the theme scope class in the gallery
    // shell) is still a class this probe has to see, and a probe that misses
    // it reports a theme as unstyled when the stylesheet is fine.
    collected.push({ file: sourceFile.fileName, text: value.head.text });
    for (const span of value.templateSpans) {
      collected.push({ file: sourceFile.fileName, text: span.literal.text });
    }
    return;
  }
  for (const key of ['whenTrue', 'whenFalse', 'left', 'right', 'expression']) {
    if (value[key] !== undefined) {
      collect(value[key], sourceFile);
    }
  }
  if (ts.isCallExpression(value)) {
    for (const argument of value.arguments) {
      collect(argument, sourceFile);
    }
    return;
  }
  if (ts.isArrayLiteralExpression(value)) {
    for (const element of value.elements) {
      collect(element, sourceFile);
    }
    return;
  }
  if (ts.isObjectLiteralExpression(value)) {
    for (const property of value.properties) {
      if (ts.isPropertyAssignment(property)) {
        collect(property.initializer, sourceFile);
      }
    }
  }
}

const STYLE_SOURCES = [
  ...walk('components/ui'),
  ...walk('components/shared'),
  ...walk('app'),
  'lib/hooks/use-toast.tsx',
  'lib/hooks/use-zod-form.ts',
];

for (const file of STYLE_SOURCES) {
  const text = readFileSync(join(ROOT, file), 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TSX,
  );
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'className') {
      const initializer = node.initializer;
      if (initializer !== undefined) {
        // A plain className="a b" attribute carries a literal rather than an
        // expression; skipping it would hide exactly the classes a component
        // applies directly to an element.
        if (ts.isStringLiteral(initializer)) {
          collected.push({ file: sourceFile.fileName, text: initializer.text });
        } else if (ts.isJsxExpression(initializer)) {
          collect(initializer.expression, sourceFile);
        }
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      CLASS_HELPERS.has(node.expression.text)
    ) {
      for (const argument of node.arguments) {
        collect(argument, sourceFile);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

const tokens = new Map();
const skipped = new Set();
for (const entry of collected) {
  for (const token of entry.text.split(/\s+/)) {
    const clean = token.trim();
    if (clean.length === 0 || !/^[a-zA-Z0-9:_\-[\]=&./>()%#'",]+$/.test(clean)) {
      continue;
    }
    if (!clean.includes('-') && !SINGLE_WORD_UTILITIES.has(clean)) {
      skipped.add(clean);
      continue;
    }
    if (!tokens.has(clean)) {
      tokens.set(clean, entry.file);
    }
  }
}

mkdirSync(TMP_DIRECTORY, { recursive: true });
const contentFile = join(TMP_DIRECTORY, 'class-tokens.txt');
writeFileSync(
  contentFile,
  `${[...tokens.keys()].join('\n')}\n${NEGATIVE_CONTROLS.join('\n')}\n`,
  'utf8',
);

const stylesheet = join(TMP_DIRECTORY, 'gallery.css');
execFileSync(
  'npx',
  ['tailwindcss', '-i', 'styles/globals.css', '-o', stylesheet, '--content', contentFile],
  { cwd: ROOT, encoding: 'utf8' },
);
const compiled = readFileSync(stylesheet, 'utf8');

function escapeClass(token) {
  let out = '';
  for (const character of token) {
    out += /[a-zA-Z0-9_-]/.test(character) ? character : `\\${character}`;
  }
  return out;
}

const missing = [];
for (const [token, file] of tokens) {
  if (!compiled.includes(`.${escapeClass(token)}`)) {
    missing.push({ token, file });
  }
}

const falsePositives = NEGATIVE_CONTROLS.filter((token) =>
  compiled.includes(`.${escapeClass(token)}`),
);

function ruleHas(selector, declaration) {
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escapeRegex(selector)}[^{}]*\\{[^}]*${escapeRegex(declaration)}`).test(
    compiled,
  );
}

const expectations = [
  // 1.15 regression anchors: control geometry
  ['.h-11', 'height: 44px', 'default control height is still the 44px touch target'],
  ['.size-11', 'width: 44px', 'an icon button is still 44x44'],
  [
    `.${escapeClass('after:-inset-3.5')}::after`,
    'inset: -14px',
    'the checkbox and radio hit area still expands to 44px',
  ],
  // 1.16 layering
  ['.z-overlay', 'z-index: 50', 'the overlay backdrop sits at the overlay layer'],
  ['.z-modal', 'z-index: 60', 'a dialog or sheet panel sits at the modal layer'],
  ['.z-dropdown', 'z-index: 70', 'menu content sits above a modal'],
  ['.z-popover', 'z-index: 80', 'popover content sits above a menu'],
  ['.z-tooltip', 'z-index: 90', 'tooltip content sits above every panel'],
  ['.z-toast', 'z-index: 100', 'toasts are never covered'],
  // 1.16 layout widths, from LAYOUT_WIDTH_TOKENS
  ['.w-popover', 'width: 20rem', 'the popover width comes from the token'],
  ['.min-w-menu', 'min-width: 10rem', 'the menu floor comes from the token'],
  ['.max-w-tooltip', 'max-width: 16rem', 'the tooltip ceiling comes from the token'],
  ['.max-w-dialog', 'max-width: 32rem', 'the dialog ceiling comes from the token'],
  ['.max-w-sheet', 'max-width: 24rem', 'the sheet ceiling comes from the token'],
  ['.w-11\\/12', 'width: 91.666667%', 'the dialog panel uses a fraction, not a raw width'],
  ['.max-h-screen', 'max-height: 100vh', 'a tall dialog scrolls inside the viewport'],
  // typography and motion
  ['.text-base', 'font-size: 16px', 'body text stays at the 16px minimum'],
  ['.text-xs', 'font-size: 12px', 'the smallest token step is still 12px'],
  ['.duration-fast', 'transition-duration: 120ms', 'the fast motion token is wired'],
  ['.ease-standard', 'transition-timing-function: cubic-bezier(0.2, 0, 0, 1)', 'standard easing'],
  // 1.17 form layer
  ['.sr-only', 'position: absolute', 'the live status region is hidden but announced'],
  ['.border-0', 'border-width: 0px', 'the form fieldset reset uses the zero step'],
  ['.text-destructive', 'color: hsl(var(--destructive))', 'error text uses the destructive role'],
  [
    `.${escapeClass('aria-[invalid=true]:border-destructive')}[aria-invalid="true"]`,
    'border-color: hsl(var(--destructive))',
    'an invalid control is bordered by the destructive role',
  ],
  ['.bg-destructive\\/10', 'background-color: hsl(var(--destructive) / 0.1)', 'error summary fill'],
  [
    '.bg-background',
    'background-color: hsl(var(--background))',
    'surfaces read the background role',
  ],
  // the pinned theme scopes the gallery renders through. These rules live in
  // @layer base, which Tailwind tree shakes by class name, so their presence
  // here is the proof that the safelist keeps them alive.
  ['.theme-light', '--background: 0 0% 100%', 'the light scope pins the light palette'],
  ['.theme-dark', '--background: 222.2 84% 4.9%', 'the dark scope pins the dark palette'],
  ['.theme-hc-light', '--border: 0 0% 30%', 'the light high contrast scope pins its border'],
  ['.theme-hc-dark', '--foreground: 0 0% 100%', 'the dark high contrast scope pins its text'],
  [
    '.theme-reduced-motion',
    '--duration-fast: 0ms',
    'the reduced motion scope removes the motion durations',
  ],
  [
    '.theme-reduced-motion *',
    'transition-duration: 0.01ms',
    'the reduced motion scope stops transitions for its descendants',
  ],
];

let expectationFailures = 0;
for (const [selector, declaration, description] of expectations) {
  if (!ruleHas(selector, declaration)) {
    expectationFailures += 1;
    process.stdout.write(`  FAIL ${description}: expected ${selector} to declare ${declaration}\n`);
  }
}

// ---------------------------------------------------------------------------
// Section 4: raw values outside the token definition files
// ---------------------------------------------------------------------------

const AUDIT_ROOTS = ['app', 'components', 'lib'];
const RAW_VALUE_PATTERNS = [
  { label: 'hex colour literal', pattern: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?\b/g },
  { label: 'rgb() or rgba() literal', pattern: /\brgba?\(/g },
  { label: 'hsl() or hsla() literal', pattern: /\bhsla?\(/g },
  { label: 'inline style attribute', pattern: /\bstyle=\{\{/g },
];

function auditFiles(directory) {
  const files = [];
  for (const entry of readdirSync(join(ROOT, directory)).sort()) {
    const relative = `${directory}/${entry}`;
    if (statSync(join(ROOT, relative)).isDirectory()) {
      files.push(...auditFiles(relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

const rawValueFindings = [];
let auditedFiles = 0;
for (const root of AUDIT_ROOTS) {
  for (const file of auditFiles(root)) {
    if (TOKEN_DEFINITION_FILES.includes(file)) {
      continue;
    }
    const extension = file.split('.').pop() ?? '';
    if (!['ts', 'tsx', 'mjs', 'css', 'md'].includes(extension)) {
      continue;
    }
    auditedFiles += 1;
    const text = readFileSync(join(ROOT, file), 'utf8');
    for (const { label, pattern } of RAW_VALUE_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        const line = text.slice(0, match.index).split('\n').length;
        rawValueFindings.push({ file, line, label, value: match[0] });
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Section 0: the safelist is load bearing
// ---------------------------------------------------------------------------

/**
 * Compile the stylesheet twice with a content file that names no theme scope:
 * once with the project configuration and once with the safelist emptied out.
 * The first must keep all five scope rules, the second must lose them, which
 * is what proves the pinned themes survive a refactor only because of the
 * safelist rather than by accident.
 */
const MINIMAL_CONTENT = 'flex\np-4\n';
const minimalContentFile = join(TMP_DIRECTORY, 'minimal-content.txt');
writeFileSync(minimalContentFile, MINIMAL_CONTENT, 'utf8');

function compileWithConfig(configPath, outputName) {
  const output = join(TMP_DIRECTORY, outputName);
  execFileSync(
    'npx',
    [
      'tailwindcss',
      '-i',
      'styles/globals.css',
      '-o',
      output,
      '--content',
      minimalContentFile,
      '--config',
      configPath,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  return readFileSync(output, 'utf8');
}

const scopeClasses = [
  'theme-light',
  'theme-dark',
  'theme-hc-light',
  'theme-hc-dark',
  'theme-reduced-motion',
];
const withSafelist = compileWithConfig(join(ROOT, 'tailwind.config.ts'), 'safelist-on.css');
const safelistOn = scopeClasses.filter((name) => withSafelist.includes(`.${name}`));

const strippedConfig = join(TMP_DIRECTORY, 'tailwind-no-safelist.config.mjs');
writeFileSync(
  strippedConfig,
  `import base from '${join(ROOT, 'tailwind.config.ts')}';\nexport default { ...base, safelist: [] };\n`,
  'utf8',
);
let safelistOff = scopeClasses;
try {
  const withoutSafelist = compileWithConfig(strippedConfig, 'safelist-off.css');
  safelistOff = scopeClasses.filter((name) => withoutSafelist.includes(`.${name}`));
} catch (error) {
  process.stdout.write(`safelist-off compile failed: ${String(error)}\n`);
}

const safelistHolds = safelistOn.length === scopeClasses.length && safelistOff.length === 0;
if (!safelistHolds) {
  process.stdout.write(
    `  FAIL safelist control: with the safelist ${String(safelistOn.length)}/${String(scopeClasses.length)} scope rules survived, without it ${String(safelistOff.length)} survived (expected 5 and 0)\n`,
  );
}

process.stdout.write(
  `scope rules with the safelist: ${safelistOn.length} of ${scopeClasses.length}\n`,
);
process.stdout.write(
  `scope rules without the safelist: ${safelistOff.length} of ${scopeClasses.length}\n`,
);
process.stdout.write(`repository root: ${ROOT}\n`);
process.stdout.write(`style sources scanned: ${STYLE_SOURCES.length}\n`);
process.stdout.write(`class tokens found: ${tokens.size}\n`);
process.stdout.write(`non-class strings skipped: ${[...skipped].sort().join(', ')}\n`);
process.stdout.write(`compiled stylesheet: ${compiled.length} bytes\n`);
process.stdout.write(`tokens with no CSS: ${missing.length}\n`);
for (const entry of missing.slice(0, 40)) {
  process.stdout.write(`  MISSING ${entry.token}  (${entry.file})\n`);
}
process.stdout.write(`negative controls that compiled: ${falsePositives.length}\n`);
for (const token of falsePositives) {
  process.stdout.write(`  UNEXPECTED ${token}\n`);
}
process.stdout.write(`declaration expectations: ${expectations.length}\n`);
process.stdout.write(`declaration failures: ${expectationFailures}\n`);
process.stdout.write(`files audited for raw values: ${auditedFiles}\n`);
process.stdout.write(`raw value findings: ${rawValueFindings.length}\n`);
for (const finding of rawValueFindings.slice(0, 40)) {
  process.stdout.write(
    `  RAW ${finding.file}:${String(finding.line)} ${finding.label} ${JSON.stringify(finding.value)}\n`,
  );
}

const ok =
  missing.length === 0 &&
  falsePositives.length === 0 &&
  expectationFailures === 0 &&
  rawValueFindings.length === 0 &&
  safelistHolds;
process.stdout.write(ok ? 'RESULT: PASS\n' : 'RESULT: FAIL\n');
process.exit(ok ? 0 : 1);
