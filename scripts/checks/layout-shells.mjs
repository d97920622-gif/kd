// path: scripts/checks/layout-shells.mjs
/**
 * check:layout-shells -- the shell contract, before the pages arrive.
 *
 * The shells in components/layout are the only place where three contracts
 * meet, and all three are invisible to every other check:
 *
 *   1. **Focus order.** The skip link must be the first focusable element in
 *      the document and it must point at the main landmark. Two files are
 *      involved, so the check reads both: the link takes its target from
 *      MAIN_CONTENT_ID, the landmark declares that id, and no component may
 *      write the id or the href by hand. A skip link that points at an id
 *      nobody declares is a control that does nothing, and it is invisible in
 *      review because both files look correct on their own.
 *   2. **One main landmark per page.** A page with two main landmarks gives a
 *      screen reader user two answers to "where is the content". Only the
 *      landmark component may declare `<main>` inside a route group.
 *   3. **The print base.** styles/print.css is the only stylesheet that is not
 *      a token declaration, and its rules are what a printed invoice depends
 *      on. The check verifies the file structurally: the page margin matches
 *      PRINT_PAGE_MARGIN_MM, every role in PRINT_ROLE_MAP is remapped in the
 *      paper block, the chrome-hiding and print-only selectors exist, and no
 *      rule carries a raw colour. The rendered result is measured separately,
 *      by the shell probe in docs/EVIDENCE.
 *
 * Everything here is a static read of the source. That is deliberate: this
 * check must run in a fresh clone with no browser, on the machine that runs
 * npm run verify, while the probe that measures the rendered page is run by
 * hand and recorded as gate evidence.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  listTrackedFiles,
  parseCssDeclarations,
  reportResult,
  REPO_ROOT,
  stripCommentsAndStrings,
} from './_lib.mjs';

const CHECK = 'layout-shells';
const TOKEN_FILE = 'config/design-tokens.ts';
const PRINT_STYLESHEET = 'styles/print.css';
const MAIN_CONTENT_MODULE = 'components/layout/main-content.tsx';
const SKIP_LINK_MODULE = 'components/layout/skip-link.tsx';
const SHELLS = ['components/layout/public-shell.tsx', 'components/layout/auth-shell.tsx'];
const ROUTE_LAYOUTS = ['app/(public)/layout.tsx', 'app/(auth)/layout.tsx'];
const GROUPS = [
  'app/(public)/',
  'app/(auth)/',
  'app/(dashboard)/',
  'app/(admin)/',
  'app/(client-portal)/',
];

const findings = [];

function finding(file, message) {
  findings.push({ file, line: 1, column: 1, message });
}

function read(path) {
  try {
    return readFileSync(join(REPO_ROOT, path), 'utf8');
  } catch {
    return null;
  }
}

function requireFile(path, message) {
  const text = read(path);
  if (text === null) {
    finding(path, message);
  }
  return text;
}

// ---------------------------------------------------------------------------
// 1. The skip link and the landmark share one id
// ---------------------------------------------------------------------------

const landmarks = requireFile(MAIN_CONTENT_MODULE, 'the main landmark component is missing');
const skipLink = requireFile(SKIP_LINK_MODULE, 'the skip link component is missing');

/*
 * Two views of the file, because the rules are about two different things.
 *
 * `skipLink` and `landmarks` are the raw source: the rules about class names
 * and catalogue keys are rules about strings, and stripping strings would
 * erase the evidence. `landMarkCode` and `skipLinkCode` have comments and
 * strings blanked, and are used for the structural rules. A check that reads
 * comments is a check that can be satisfied by prose: removing tabIndex from
 * the markup while leaving the sentence that explains it in place must fail,
 * and an unstripped read passes it.
 */
const landMarkCode = landmarks === null ? null : stripCommentsAndStrings(landmarks);

if (landmarks !== null && landMarkCode !== null) {
  if (!/export const MAIN_CONTENT_ID = '([a-z0-9-]+)'/.test(landmarks)) {
    finding(MAIN_CONTENT_MODULE, 'MAIN_CONTENT_ID must be exported as a literal string');
  }
  if (!/id=\{MAIN_CONTENT_ID\}/.test(landMarkCode)) {
    finding(MAIN_CONTENT_MODULE, 'the landmark must take its id from MAIN_CONTENT_ID');
  }
  if (!/tabIndex=\{-1\}/.test(landMarkCode)) {
    finding(
      MAIN_CONTENT_MODULE,
      'the landmark must carry tabIndex={-1}: a target without a tabindex cannot receive focus, so the skip link would leave focus on itself',
    );
  }
  if (!/<main\b/.test(landmarks)) {
    finding(MAIN_CONTENT_MODULE, 'the main landmark must render a <main> element');
  }
}

const skipLinkCode = skipLink === null ? null : stripCommentsAndStrings(skipLink);

if (skipLink !== null && skipLinkCode !== null) {
  if (!/from '\.\/main-content'/.test(skipLink)) {
    finding(SKIP_LINK_MODULE, 'the skip link must import MAIN_CONTENT_ID from the landmark module');
  }
  if (!/href=\{`#\$\{MAIN_CONTENT_ID\}`\}/.test(skipLink)) {
    finding(SKIP_LINK_MODULE, 'the skip link must build its href from MAIN_CONTENT_ID');
  }
  if (/#main-content/.test(skipLink)) {
    finding(SKIP_LINK_MODULE, 'the skip link must not repeat the id as a literal');
  }
  if (!/common\.label_skip_to_content/.test(skipLink)) {
    finding(SKIP_LINK_MODULE, 'the skip link label must come from the string catalogue');
  }
  if (!/sr-only/.test(skipLink) || !/focus:not-sr-only/.test(skipLink)) {
    finding(
      SKIP_LINK_MODULE,
      'the skip link must be visually hidden until focused: it has to stay the first tab stop when it is not painted',
    );
  }
  if (!/focus-visible:ring-2/.test(skipLink)) {
    finding(SKIP_LINK_MODULE, 'the skip link must draw a visible focus ring');
  }
}

// ---------------------------------------------------------------------------
// 2. Every shell: skip link first, one landmark, no hand-written <main>
// ---------------------------------------------------------------------------

for (const shell of SHELLS) {
  const source = requireFile(shell, 'a layout shell named by config is missing');
  if (source === null) {
    continue;
  }
  const text = stripCommentsAndStrings(source);
  const skipIndex = text.indexOf('<SkipLink');
  const mainIndex = text.indexOf('<MainContent');
  if (skipIndex < 0) {
    finding(shell, 'the shell must render the skip link');
  }
  if (mainIndex < 0) {
    finding(shell, 'the shell must render the main landmark');
  }
  if (skipIndex >= 0 && mainIndex >= 0 && skipIndex > mainIndex) {
    finding(
      shell,
      'the skip link must come before the main landmark, or it is not the first tab stop',
    );
  }
  if (/<main\b/.test(text)) {
    finding(shell, 'the shell must not declare <main> itself; the landmark component owns it');
  }
}

for (const layout of ROUTE_LAYOUTS) {
  const text = requireFile(layout, 'a route-group layout named by the plan is missing');
  if (text === null) {
    continue;
  }
  if (!/print\.css/.test(text)) {
    finding(layout, 'the layout must import the print base so the group prints predictably');
  }
}

// A route group must not declare its own <main>: two landmarks on one page is
// the ambiguity the landmark component exists to prevent. The development
// group is exempt, because its pages are standalone tools rather than product
// routes; the specimen page there renders the shells themselves.
const LANDMARK_EXEMPT = ['app/(dev)/layout.tsx'];
for (const file of listTrackedFiles()) {
  if (!GROUPS.some((group) => file.startsWith(group))) {
    continue;
  }
  if (LANDMARK_EXEMPT.includes(file)) {
    continue;
  }
  const text = read(file);
  if (text === null || !/<main\b/.test(text)) {
    continue;
  }
  finding(
    file,
    'a route under a layout group must not declare <main>: the shell owns the one landmark on the page',
  );
}

// ---------------------------------------------------------------------------
// 3. The print base
// ---------------------------------------------------------------------------

const print = requireFile(PRINT_STYLESHEET, 'the print base stylesheet is missing');
if (print !== null) {
  const tokens = read(TOKEN_FILE) ?? '';
  const marginMatch = /export const PRINT_PAGE_MARGIN_MM = (\d+);/.exec(tokens);
  const expectedMargin = marginMatch === null ? null : `${marginMatch[1]}mm`;
  if (expectedMargin === null) {
    finding(TOKEN_FILE, 'PRINT_PAGE_MARGIN_MM was not found in the token module');
  } else if (!new RegExp(`@page\\s*\\{[^}]*margin:\\s*${expectedMargin}`).test(print)) {
    finding(
      PRINT_STYLESHEET,
      `the @page margin must be ${expectedMargin}, the value PRINT_PAGE_MARGIN_MM declares`,
    );
  }

  const records = parseCssDeclarations(print);

  /**
   * Declarations for one selector inside print, selector lists included.
   *
   * A rule written as `h1, h2, tr { break-inside: avoid }` carries its
   * selectors in a single path entry, so a lookup by exact selector misses it.
   * Splitting the list is the difference between checking the stylesheet that
   * was written and checking the stylesheet that was written as a list. Quote
   * style is normalised too: attribute selectors are equivalent in single and
   * double quotes, and a check that only recognises one of them is a check
   * that reports a missing rule the browser is applying.
   */
  const mediaPrint = (selector) => {
    const result = new Map();
    for (const record of records) {
      if (!record.path.some((entry) => entry.startsWith('@media print'))) {
        continue;
      }
      const selectors = String(record.path[record.path.length - 1] ?? '')
        .split(',')
        .map((entry) => entry.replace(/\s+/g, ' ').trim().replace(/'/g, '"'));
      if (selectors.includes(selector)) {
        result.set(record.property, record.value);
      }
    }
    return result;
  };

  // The paper block remaps the semantic roles. It is written as a selector list
  // so one block covers the base theme, the dark class and every pinned scope.
  const paperRoles = new Map();
  for (const record of records) {
    if (!record.path.some((entry) => entry.startsWith('@media print'))) {
      continue;
    }
    if (!record.path.some((entry) => entry.includes('.theme-dark') || entry.startsWith(':root'))) {
      continue;
    }
    if (record.property.startsWith('--')) {
      paperRoles.set(record.property, record.value);
    }
  }
  const roleMapMatch = /export const PRINT_ROLE_MAP[^=]*=\s*\{([\s\S]*?)\n\};/.exec(tokens);
  if (roleMapMatch === null) {
    finding(TOKEN_FILE, 'PRINT_ROLE_MAP was not found in the token module');
  } else {
    const pairs = [...roleMapMatch[1].matchAll(/^\s*'?([a-z-]+)'?:\s*'(--print-[a-z-]+)'/gm)];
    if (pairs.length === 0) {
      finding(TOKEN_FILE, 'PRINT_ROLE_MAP declares no mapping');
    }
    for (const [, role, token] of pairs) {
      const declared = paperRoles.get(`--${role}`);
      if (declared === undefined) {
        finding(
          PRINT_STYLESHEET,
          `print does not remap --${role}; a role left alone keeps its screen colour on paper`,
        );
      } else if (declared.trim() !== `var(${token})`) {
        finding(
          PRINT_STYLESHEET,
          `print maps --${role} to ${declared.trim()} but PRINT_ROLE_MAP says var(${token})`,
        );
      }
    }
  }

  // Chrome off, paper-only blocks on, meaning kept without colour.
  const hide = mediaPrint('[data-print="hide"]');
  if (hide.get('display') !== 'none') {
    finding(PRINT_STYLESHEET, 'print must hide [data-print="hide"]');
  }
  for (const chrome of ['nav', 'button']) {
    const block = mediaPrint(chrome);
    if (block.get('display') !== 'none') {
      finding(PRINT_STYLESHEET, `print must hide ${chrome}: an action cannot be used on paper`);
    }
  }
  if (!/:root \[data-print='only'\]/.test(print) && !/:root \[data-print="only"\]/.test(print)) {
    finding(PRINT_STYLESHEET, 'print must reveal [data-print="only"] blocks');
  }
  const outline = mediaPrint('[data-print="outline"]');
  if (outline.get('border') === undefined) {
    finding(
      PRINT_STYLESHEET,
      'print must outline [data-print="outline"]: a status carried only by a fill prints as blank paper',
    );
  }

  // Page breaks: a row that splits across sheets loses its header.
  const row = mediaPrint('tr');
  if (row.get('break-inside') !== 'avoid') {
    finding(PRINT_STYLESHEET, 'print must keep a table row whole');
  }

  // No raw colour: every colour in the print base resolves to a token. A
  // colour function wrapped around var(--token) is a token reference, which is
  // the only form the application code allows either.
  const tokenColour = /\b(?:hsla?|rgba?|oklch|lab|lch|color)\(\s*var\(--[a-z0-9-]+\)\s*\)/g;
  const colourLiteral = /(#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\()/;
  for (const line of print.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }
    const withoutTokens = trimmed.replace(tokenColour, 'token');
    if (colourLiteral.test(withoutTokens)) {
      finding(
        PRINT_STYLESHEET,
        `a raw colour in the print base: "${trimmed.slice(0, 60)}"; the paper palette is declared in styles/globals.css`,
      );
    }
  }
}

reportResult(
  CHECK,
  findings,
  `${String(SHELLS.length)} shells and ${String(ROUTE_LAYOUTS.length)} route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), print base verified against ${TOKEN_FILE}`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
