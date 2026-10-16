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
 *   3. **Role framing.** The frame a reader gets is data (role-framing.ts), not
 *      three layout files that drifted. The check holds the table to the six
 *      roles of the role model, to the catalogue keys it names, and to the
 *      audience each group serves; it keeps the client portal free of
 *      navigation; it requires the session seam to fail closed and to preview
 *      as the lowest-privilege role of its audience rather than a privileged
 *      one. What it cannot check is authorization, and that is the point of
 *      the design: a frame is not a gate, and the check verifies the frame.
 *   4. **The print base.** styles/print.css is the only stylesheet that is not
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
const SHELLS = [
  'components/layout/public-shell.tsx',
  'components/layout/auth-shell.tsx',
  'components/layout/dashboard-shell.tsx',
  'components/layout/admin-shell.tsx',
  'components/layout/client-portal-shell.tsx',
];
const ROUTE_LAYOUTS = [
  'app/(public)/layout.tsx',
  'app/(auth)/layout.tsx',
  'app/(dashboard)/layout.tsx',
  'app/(admin)/layout.tsx',
  'app/(client-portal)/layout.tsx',
];
const GROUPS = [
  'app/(public)/',
  'app/(auth)/',
  'app/(dashboard)/',
  'app/(admin)/',
  'app/(client-portal)/',
];
const ROOT_LAYOUT = 'app/layout.tsx';
const ROLE_FRAMING_MODULE = 'components/layout/role-framing.ts';
const SESSION_ROLE_MODULE = 'components/layout/session-role.ts';
const CLIENT_PORTAL_SHELL = 'components/layout/client-portal-shell.tsx';

/**
 * The six roles of the role model in MASTER_PROMPT, and the five that sign in.
 *
 * The list is written out here rather than imported from the framing table on
 * purpose: a check that reads its expectation from the code it verifies can
 * only prove that the code equals itself. Deleting a role from the table has
 * to fail this check, which means this file has to know what the answer is.
 */
const MANDATED_ROLES = ['super_admin', 'ceo', 'admin_staff', 'owner', 'staff', 'client'];

/**
 * The one role that never signs in, and therefore the one that must never be
 * previewed by the session seam: a client reaches one document through a
 * tokenized link, so there is no session for the seam to resolve and no
 * preview that would be honest.
 */
const TOKENIZED_ROLE = 'client';

/** Each audience and the group that serves it, so a role cannot be orphaned. */
const AUDIENCE_GROUP = {
  platform: 'app/(admin)/layout.tsx',
  tenant: 'app/(dashboard)/layout.tsx',
  client: 'app/(client-portal)/layout.tsx',
};

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

/*
 * The print base has one owner. It is imported by the root layout, and no
 * route-group layout imports it: a base that every group must remember to
 * include is a base that some group will one day omit, and a duplicated import
 * is two places to look when the paper rules change.
 */
const rootLayout = requireFile(ROOT_LAYOUT, 'the root layout is missing');
if (rootLayout !== null && !/print\.css/.test(rootLayout)) {
  finding(
    ROOT_LAYOUT,
    'the root layout must import styles/print.css: every group can be printed, so the paper rules belong where every group loads from',
  );
}
for (const layout of ROUTE_LAYOUTS) {
  const text = requireFile(layout, 'a route-group layout named by the plan is missing');
  if (text === null) {
    continue;
  }
  if (/print\.css/.test(text)) {
    finding(
      layout,
      'a route-group layout must not import styles/print.css; the root layout owns it, and a second import is a second place to keep correct',
    );
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
// 3. Role framing: every role framed, every frame readable, no frame orphaned
// ---------------------------------------------------------------------------

const AUDIENCE_SHELL = {
  platform: 'components/layout/admin-shell.tsx',
  tenant: 'components/layout/dashboard-shell.tsx',
  client: 'components/layout/client-portal-shell.tsx',
};

/** The preview roles the seam answers in development, lowest privilege first. */
const EXPECTED_PREVIEW_ROLES = { dashboard: 'staff', admin: 'admin_staff' };

/** Every catalogue key, as `namespace.key`, read out of the string files. */
function catalogueKeys() {
  const keys = new Set();
  for (const file of listTrackedFiles()) {
    if (!file.startsWith('lib/i18n/strings/en/') || !file.endsWith('.ts')) {
      continue;
    }
    const text = read(file);
    if (text === null) {
      continue;
    }
    const namespace = file.slice('lib/i18n/strings/en/'.length, -'.ts'.length);
    for (const match of text.matchAll(/^ {2}([a-z][a-z0-9_]*):/gm)) {
      keys.add(`${namespace}.${match[1]}`);
    }
  }
  return keys;
}

const framingText = requireFile(ROLE_FRAMING_MODULE, 'the role framing module is missing');
if (framingText !== null) {
  const table = /export const ROLE_FRAMING[\s\S]*?=\s*\{([\s\S]*?)\n\};/.exec(framingText);
  if (table === null) {
    finding(ROLE_FRAMING_MODULE, 'ROLE_FRAMING was not found as a literal table');
  } else {
    const entries = new Map();
    for (const match of table[1].matchAll(/\n {2}([a-z_]+): \{([\s\S]*?)\n {2}\},/g)) {
      entries.set(match[1], match[2]);
    }

    // Every mandated role is framed, and no role is invented.
    for (const role of MANDATED_ROLES) {
      if (!entries.has(role)) {
        finding(
          ROLE_FRAMING_MODULE,
          `the role model lists ${role} but ROLE_FRAMING has no frame for it`,
        );
      }
    }
    for (const role of entries.keys()) {
      if (!MANDATED_ROLES.includes(role)) {
        finding(ROLE_FRAMING_MODULE, `${role} is not one of the six roles of the role model`);
      }
    }

    const keys = catalogueKeys();
    for (const [role, body] of entries) {
      const audience = /audience: '([a-z]+)'/.exec(body);
      if (audience === null) {
        finding(ROLE_FRAMING_MODULE, `the ${role} frame declares no audience`);
        continue;
      }
      if (!MANDATED_ROLES.includes(role)) {
        continue;
      }
      const expectedShell = AUDIENCE_SHELL[audience[1]];
      if (expectedShell === undefined) {
        finding(ROLE_FRAMING_MODULE, `the ${role} frame has an unknown audience ${audience[1]}`);
        continue;
      }

      // The client audience has no navigation, and that is the design.
      if (audience[1] === 'client') {
        if (!/hasNavigation: false/.test(body)) {
          finding(
            ROLE_FRAMING_MODULE,
            'the client frame must declare hasNavigation: false: a menu on a single-document page is a way for the reader to get lost',
          );
        }
        const clientShell = requireFile(CLIENT_PORTAL_SHELL, 'the client portal shell is missing');
        const clientShellCode = clientShell === null ? null : stripCommentsAndStrings(clientShell);
        if (clientShellCode !== null && /\b(sidebar|topBar|bottomBar)\b/.test(clientShellCode)) {
          finding(
            CLIENT_PORTAL_SHELL,
            'the client portal shell must accept no navigation slot; the omission is the design',
          );
        }
      } else if (!/hasNavigation: true/.test(body)) {
        finding(ROLE_FRAMING_MODULE, `the ${role} frame must offer navigation`);
      }

      // Every copy key a frame names has to exist in the catalogue.
      for (const keyMatch of body.matchAll(/[A-Za-z]+Key: '([a-z0-9_.]+)'/g)) {
        if (!keys.has(keyMatch[1])) {
          finding(
            ROLE_FRAMING_MODULE,
            `the ${role} frame references ${keyMatch[1]}, which no string namespace declares`,
          );
        }
      }

      // The frame's shell is the one its group renders. The group name is not
      // the audience name - platform administration lives under (admin) - so
      // the mapping is declared once, above, and read here.
      const groupLayout = AUDIENCE_GROUP[audience[1]];
      if (groupLayout === undefined) {
        finding(
          ROLE_FRAMING_MODULE,
          `the ${audience[1]} audience has no route group; every role would be framed as somebody else`,
        );
      } else {
        const layoutText = read(groupLayout) ?? '';
        const shellName = expectedShell.split('/').pop().replace('.tsx', '');
        if (!layoutText.includes(shellName)) {
          finding(
            groupLayout,
            `the ${audience[1]} group must render ${shellName}, the shell the framing table gives that audience`,
          );
        }
      }
    }

    // A frame that is never rendered is a frame nobody maintains: each of the
    // three audiences must be reachable from a group layout.
    for (const audience of Object.keys(AUDIENCE_SHELL)) {
      const framed = [...entries.values()].some((body) => body.includes(`audience: '${audience}'`));
      if (!framed) {
        finding(ROLE_FRAMING_MODULE, `no role is framed for the ${audience} audience`);
      }
    }
  }

  // The frame must be measurable in the response, not only in the source.
  for (const shell of SHELLS) {
    const text = read(shell) ?? '';
    if (shell.includes('public') || shell.includes('auth')) {
      continue;
    }
    if (!/roleDataAttributes\(/.test(text) || !/\{\.\.\.data\}/.test(text)) {
      finding(
        shell,
        'a role-aware shell must put the role and audience on its root element, so the rendered frame can be measured instead of assumed',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The session seam: no privileged default, no fail-open
// ---------------------------------------------------------------------------

const seam = requireFile(SESSION_ROLE_MODULE, 'the session role seam is missing');
if (seam !== null) {
  if (!/isDevelopment\(\)/.test(seam)) {
    finding(
      SESSION_ROLE_MODULE,
      'the seam must decide between a development preview and no role at all; without that decision it is a stub that ships',
    );
  }
  const seamCode = stripCommentsAndStrings(seam);
  if (!/return .*: null;/.test(seamCode)) {
    finding(
      SESSION_ROLE_MODULE,
      'the seam must fail closed: outside development it answers no role rather than a default one',
    );
  }
  for (const [group, role] of Object.entries(EXPECTED_PREVIEW_ROLES)) {
    const declaration = new RegExp(`${group}:\\s*'([a-z_]+)'`);
    const match = declaration.exec(seam);
    if (match === null) {
      finding(SESSION_ROLE_MODULE, `the seam declares no development preview role for ${group}`);
      continue;
    }
    if (match[1] !== role) {
      finding(
        SESSION_ROLE_MODULE,
        `the ${group} preview role is ${match[1]}; it must be ${role}, the lowest privilege role of that audience, or the preview shows the developer a frame almost no reader sees`,
      );
    }
  }
  if (new RegExp(`'${TOKENIZED_ROLE}'`).test(seamCode)) {
    finding(
      SESSION_ROLE_MODULE,
      'the seam must not preview the client role: that audience never has a session, and a preview of it would suggest the portal is reached by signing in',
    );
  }
  if (/super_admin|owner/.test(seamCode.replace(/DEVELOPMENT_PREVIEW_ROLE|FramingGroup/g, ''))) {
    const privileged = /'super_admin'|'owner'/.test(seamCode);
    if (privileged) {
      finding(
        SESSION_ROLE_MODULE,
        'the seam must never preview as a privileged role: a frame that flatters the developer hides what most readers see',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 5. The print base
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
  `${String(SHELLS.length)} shells and ${String(ROUTE_LAYOUTS.length)} route-group layouts verified (skip link first, one landmark per page, id shared with the landmark), ${String(MANDATED_ROLES.length)} roles framed through one seam with no privileged default, print base verified against ${TOKEN_FILE}`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
