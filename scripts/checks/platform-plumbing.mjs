// path: scripts/checks/platform-plumbing.mjs
/**
 * check:platform-plumbing -- the platform layer that answers before a page does.
 *
 * Sub-step 1.30 delivers six things that are not pages: the request-time
 * content security policy in `middleware.ts`, the start-up and failure hooks in
 * `instrumentation.ts`, the sitemap and robots routes, the metadata baseline in
 * the root layout, and the paper contract the print stylesheet declares. None of
 * them is a screen, which is exactly why they need a check: a reader notices a
 * broken page immediately and nothing at all notices a policy that stopped
 * covering the scripts it was written for.
 *
 * What this check can prove and what it cannot:
 *
 *   1. **The policy is proved by running it.** The content security policy
 *      module is pure - it imports nothing, reads no environment and touches no
 *      clock - so this check imports it through Node's type stripping and
 *      asserts the two policies it produces. Reading the source for the absence
 *      of a token would prove nothing: the development branch is allowed to
 *      contain `'unsafe-inline'`, and only the built value says whether it
 *      reached the production one.
 *   2. **The request layer is proved by reading it.** A middleware cannot be
 *      executed without a request, so the rules here are about placement and
 *      ownership: the nonce is generated inside the handler rather than at
 *      module scope, the policy is set on the request *and* the response, and
 *      the matcher covers documents rather than every asset.
 *   3. **The list is proved against the map.** The sitemap's sections and the
 *      robots refusals are read out of `config/nav-map.ts`, which is already the
 *      single source of destinations, and the tables in `lib/seo/` have to
 *      account for every public section exactly once. That is the rule that
 *      survives someone adding a section next year: the check fails on the day
 *      the section is added, not on the day a crawler indexes the wrong page.
 *   4. **What reaches a browser is the probe's job.** Whether a nonce differs
 *      between two responses, whether every sitemap URL answers 200 and whether
 *      the compiled stylesheet carries the print sheets are questions about a
 *      running server. `docs/EVIDENCE/step-01/platform-probe.py` answers them
 *      by hand and the result is recorded as gate evidence, because verify runs
 *      in a fresh clone with no server and no browser.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import { blankRange, listTrackedFiles, reportResult, REPO_ROOT } from './_lib.mjs';

const CHECK = 'platform-plumbing';
const NEXT_CONFIG = 'next.config.js';
const MIDDLEWARE = 'middleware.ts';
const INSTRUMENTATION = 'instrumentation.ts';
const INSTRUMENTATION_NODE = 'instrumentation-node.ts';
const CSP_MODULE = 'lib/security/content-security-policy.ts';
const ENV_MODULE = 'lib/env/validate-env.ts';
const NAV_MAP = 'config/nav-map.ts';
const SITEMAP_MODULE = 'lib/seo/sitemap.ts';
const SITEMAP_ROUTE = 'app/sitemap.ts';
const ROBOTS_MODULE = 'lib/seo/robots.ts';
const ROBOTS_ROUTE = 'app/robots.ts';
const SITE_MODULE = 'lib/seo/site.ts';
const ROOT_LAYOUT = 'app/layout.tsx';
const METADATA_MODULE = 'lib/seo/metadata.ts';
const SOCIAL_IMAGE_MODULE = 'lib/seo/social-image.ts';
const OG_IMAGE_ROUTE = 'app/opengraph-image.tsx';
const OG_IMAGE_MODULE = 'lib/seo/og-image.ts';
const PRINT_MARKER = 'components/layout/print-marker.tsx';

const findings = [];

function finding(file, message) {
  findings.push({ file, line: 1, column: 1, message });
}

function read(file) {
  try {
    return readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

/**
 * A file with its comments blanked and its string literals intact.
 *
 * Two rules here have already been satisfied by a comment: the middleware's doc
 * block explains where the nonce is generated, and `instrumentation.ts` names
 * `getEnv()` in prose before the line that calls it. A rule that reads a file
 * whole is a rule a sentence can pass, so every code-shaped rule below reads
 * this copy. Strings are kept because most of what is being checked *is* a
 * string - a directive, a path, a metadata value.
 */
function withoutComments(file, text) {
  const scanner = ts.createScanner(ts.ScriptTarget.ES2022, false, ts.LanguageVariant.JSX, text);
  const out = text.split('');
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      blankRange(text, out, scanner.getTokenStart(), scanner.getTokenEnd());
    }
  }
  return out.join('');
}

function readCode(file) {
  const text = read(file);
  return text === null ? null : withoutComments(file, text);
}

function requireFile(file, message) {
  const code = readCode(file);
  if (code === null) {
    finding(file, message);
  }
  return code;
}

/** Index of a needle, or -1. Used to compare positions rather than presence. */
function indexOf(text, needle) {
  return text === null ? -1 : text.indexOf(needle);
}

// ---------------------------------------------------------------------------
// 1. The content security policy, proved by running it
// ---------------------------------------------------------------------------

const PROBE_SCRIPT = `
const module = await import(${JSON.stringify(join(REPO_ROOT, CSP_MODULE))});
const production = module.contentSecurityPolicy({ nonce: 'CHECKNONCE', environment: 'production' });
const development = module.contentSecurityPolicy({ nonce: 'CHECKNONCE', environment: 'development' });
const first = module.newCspNonce();
const second = module.newCspNonce();
process.stdout.write(
  JSON.stringify({
    production,
    development,
    nonceA: first,
    nonceB: second,
    relaxations: module.DEVELOPMENT_RELAXATIONS,
  }),
);
`;

/** The two policies and two nonces, or null when the module will not run. */
function readPolicyBehaviour() {
  const result = spawnSync(
    process.execPath,
    ['--experimental-strip-types', '--input-type=module', '-e', PROBE_SCRIPT],
    { encoding: 'utf8' },
  );
  if (result.status !== 0 || result.stdout.trim() === '') {
    finding(
      CSP_MODULE,
      `the policy module must run on its own with no environment: ${(result.stderr ?? '').trim().split('\n').pop() ?? 'no output'}`,
    );
    return null;
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    finding(CSP_MODULE, 'the policy probe did not return JSON');
    return null;
  }
}

/** One directive's value out of a policy string. */
function directive(policy, name) {
  const found = policy
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `));
  return found ?? '';
}

const cspSource = requireFile(
  CSP_MODULE,
  'the content security policy module is missing; the nonce half of the policy has to be built where the request is',
);
const behaviour = readPolicyBehaviour();
if (behaviour !== null) {
  const production = behaviour.production ?? '';
  const development = behaviour.development ?? '';
  if (!/^'nonce-CHECKNONCE'$/.test(directive(production, 'script-src').split(' ')[2] ?? '')) {
    finding(
      CSP_MODULE,
      'the production script-src must carry the nonce as its third source: the framework writes inline scripts into the document and the nonce is what allows them',
    );
  }
  for (const token of ['nonce-CHECKNONCE']) {
    if (!directive(production, 'script-src').includes(token)) {
      finding(CSP_MODULE, 'the production script-src must name the nonce');
    }
    if (!directive(production, 'style-src').includes(token)) {
      finding(CSP_MODULE, 'the production style-src must name the nonce');
    }
  }
  if (!directive(production, 'script-src').includes("'strict-dynamic'")) {
    finding(
      CSP_MODULE,
      'the production script-src must carry strict-dynamic: without it every script the framework loads from a nonced one has to be listed by path',
    );
  }
  if (!directive(production, 'script-src').includes("'self'")) {
    finding(
      CSP_MODULE,
      'the production script-src must keep self beside the nonce: a browser that ignores strict-dynamic falls back to the origin list, and the fallback has to be safe',
    );
  }
  for (const forbidden of ['unsafe-inline', 'unsafe-eval']) {
    if (production.includes(forbidden)) {
      finding(
        CSP_MODULE,
        `the production policy must not contain ${forbidden}; the development relaxations may not reach the deployed origin`,
      );
    }
  }
  if (directive(production, 'frame-ancestors') !== "frame-ancestors 'none'") {
    finding(CSP_MODULE, 'the production policy must refuse framing: frame-ancestors none');
  }
  if (!production.includes('upgrade-insecure-requests')) {
    finding(
      CSP_MODULE,
      'the production policy must upgrade insecure requests; a page loaded over plain HTTP would otherwise keep loading plain subresources',
    );
  }
  for (const directiveName of ['default-src', 'object-src', 'base-uri', 'form-action']) {
    if (directive(production, directiveName) === '') {
      finding(
        CSP_MODULE,
        `the policy must state ${directiveName}: a directive that is missing is a directive a browser fills in with its default`,
      );
    }
  }
  if (!development.includes('unsafe-eval')) {
    finding(
      CSP_MODULE,
      'the development policy must allow unsafe-eval: React Refresh compiles and evaluates modules at runtime, and a development server that cannot compile is not a strict server, it is a broken one',
    );
  }
  if (!directive(development, 'style-src').includes('unsafe-inline')) {
    finding(
      CSP_MODULE,
      'the development policy must allow unsafe-inline styles: the development server injects styles at runtime',
    );
  }
  if (development.includes('frame-ancestors')) {
    finding(
      CSP_MODULE,
      'the development policy must not refuse framing: the build is reviewed inside the hosting platform preview window, which is a frame',
    );
  }
  if (behaviour.nonceA === behaviour.nonceB) {
    finding(
      CSP_MODULE,
      'two calls must not return the same nonce: a nonce that repeats is a constant with a random-looking value',
    );
  }
  for (const nonce of [behaviour.nonceA ?? '', behaviour.nonceB ?? '']) {
    if (!/^[A-Za-z0-9+/_-]{22}$/.test(nonce)) {
      finding(
        CSP_MODULE,
        `a nonce must be 128 bits of base64url, without padding: "${nonce.slice(0, 12)}" is not`,
      );
    }
  }
  if (cspSource !== null) {
    if (!/crypto\.getRandomValues\(/.test(cspSource) || !/new Uint8Array\(16\)/.test(cspSource)) {
      finding(
        CSP_MODULE,
        'the nonce must come from the platform random source, 128 bits per request: Math.random is not a nonce generator',
      );
    }
    const relaxations = Array.isArray(behaviour.relaxations) ? behaviour.relaxations : [];
    if (relaxations.length === 0) {
      finding(CSP_MODULE, 'every development relaxation must be named in DEVELOPMENT_RELAXATIONS');
    }
    // A relaxation is read as "<directive> allows <what>", so each entry names
    // the directive it widens: an entry that reads as prose cannot be compared
    // with the policy it is supposed to explain.
    const relaxed = /^[a-z-]+ allows /;
    for (const relaxation of relaxations) {
      if (!relaxed.test(String(relaxation))) {
        finding(
          CSP_MODULE,
          `the relaxation "${String(relaxation).slice(0, 48)}" does not name the directive it widens`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2. The middleware: placement, ownership and reach
// ---------------------------------------------------------------------------

const middleware = requireFile(
  MIDDLEWARE,
  'middleware.ts is missing; the per-request half of the content security policy has no home',
);
if (middleware !== null) {
  if (/'use client'/.test(middleware)) {
    finding(
      MIDDLEWARE,
      'the middleware runs on the server; a client directive would make it a browser module',
    );
  }
  const handlerAt = indexOf(middleware, 'export function middleware');
  const nonceAt = indexOf(middleware, 'newCspNonce()');
  if (handlerAt < 0) {
    finding(MIDDLEWARE, 'the file must export the middleware handler');
  } else if (nonceAt < handlerAt) {
    finding(
      MIDDLEWARE,
      'the nonce must be generated inside the handler: a nonce built at module scope is one value for every response, which is the shape of a policy that protects nothing',
    );
  }
  if ((middleware.match(/newCspNonce\(\)/g) ?? []).length !== 1) {
    finding(MIDDLEWARE, 'the nonce is generated exactly once per request, in one place');
  }
  if (!/requestHeaders\.set\('Content-Security-Policy', policy\)/.test(middleware)) {
    finding(
      MIDDLEWARE,
      'the policy must be set on the request headers: that is how the framework finds the nonce to stamp onto the scripts it writes into the document',
    );
  }
  if (!/response\.headers\.set\('Content-Security-Policy', policy\)/.test(middleware)) {
    finding(
      MIDDLEWARE,
      'the policy must be set on the response: a policy the browser never receives is a comment',
    );
  }
  if (!/requestHeaders\.set\(CSP_NONCE_HEADER, nonce\)/.test(middleware)) {
    finding(
      MIDDLEWARE,
      'the nonce must travel as the request header the module declares, so a document can read it without parsing the policy',
    );
  }
  if (/'\/\(\(\?!_next\/static/.test(middleware) === false) {
    finding(MIDDLEWARE, 'the matcher must be written as an explicit exclusion list');
  }
  for (const excluded of ['_next/static', '_next/image', 'favicon.ico']) {
    if (!middleware.includes(excluded)) {
      finding(
        MIDDLEWARE,
        `the matcher must exclude ${excluded}: this is a document policy, and asking middleware to stamp every asset costs a function invocation per file`,
      );
    }
  }
  for (const [needle, reason] of [
    ['NextResponse.redirect', 'routing decisions belong to the framework, not to the policy layer'],
    [
      'NextResponse.rewrite',
      'rewriting a request is a routing decision, and step 1 has no routes to redirect',
    ],
    [
      'cookies()',
      'the policy layer must not read a session; authentication arrives in step 2 with its own seam',
    ],
  ]) {
    if (middleware.includes(needle)) {
      finding(MIDDLEWARE, `${needle} in the middleware: ${reason}`);
    }
  }
  const nextConfig = readCode(NEXT_CONFIG);
  if (nextConfig !== null && /nonce/i.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the build configuration must not mention a nonce: a per-request value has no place in a static header list, and two owners of one policy is how a directive gets lost',
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Instrumentation: fail fast at boot, report at failure
// ---------------------------------------------------------------------------

const instrumentation = requireFile(
  INSTRUMENTATION,
  'instrumentation.ts is missing; the environment is validated nowhere at start-up',
);
if (instrumentation !== null) {
  if (!/export async function register\(\)/.test(instrumentation)) {
    finding(INSTRUMENTATION, 'the file must export the register hook');
  }
  if (!/export async function onRequestError\(/.test(instrumentation)) {
    finding(
      INSTRUMENTATION,
      'the file must export the request failure hook, and it must be async to reach the Node.js half',
    );
  }
  if (/^import /m.test(instrumentation)) {
    finding(
      INSTRUMENTATION,
      'the entry point must import nothing at the top level: it is compiled for every runtime, and a Node.js module at the top of the file fails the build of the runtime that has none',
    );
  }
  const guarded = (instrumentation.match(/process\.env\.NEXT_RUNTIME === 'nodejs'/g) ?? []).length;
  if (guarded < 2) {
    finding(
      INSTRUMENTATION,
      'both hooks must test NEXT_RUNTIME before doing anything: the branch is what the compiler drops from the other runtime',
    );
  }
  const dynamic = (instrumentation.match(/await import\('\.\/instrumentation-node'\)/g) ?? [])
    .length;
  if (dynamic < 2) {
    finding(
      INSTRUMENTATION,
      'both hooks must reach the Node.js half through a dynamic import inside the runtime guard',
    );
  }
}

const instrumentationNode = requireFile(
  INSTRUMENTATION_NODE,
  'instrumentation-node.ts is missing; the start-up hooks have no implementation',
);
if (instrumentationNode !== null) {
  const registerAt = indexOf(instrumentationNode, 'export function registerService');
  const envAt = indexOf(instrumentationNode, 'getEnv()');
  if (envAt < 0 || envAt < registerAt) {
    finding(
      INSTRUMENTATION_NODE,
      'the environment must be validated inside the start-up function: a process that boots with a broken configuration should refuse to start, not answer 500',
    );
  }
  if (!/withNewCorrelationId\(/.test(instrumentationNode)) {
    finding(
      INSTRUMENTATION_NODE,
      'the failure hook must log inside a fresh correlation scope, so the id in the record is the reference the reader quotes',
    );
  }
  if (!/logger\.error\(/.test(instrumentationNode)) {
    finding(INSTRUMENTATION_NODE, 'the failure hook must report through the structured logger');
  }
  if (/console\./.test(instrumentationNode)) {
    finding(
      INSTRUMENTATION_NODE,
      'the start-up path must not print: the logger is the only writer',
    );
  }
  // The code, not the class name. A production build renames every class, so a
  // refusal record that carries only `error_name` reaches the operator as
  // `"error_name":"aI"` - which is what the refusal log of this sub-step showed
  // before the code was added beside it.
  const codeSites = (
    instrumentationNode.match(
      /error_code: \w+ instanceof AppError \? \w+\.code : 'unclassified'/g,
    ) ?? []
  ).length;
  if (codeSites !== 2) {
    finding(
      INSTRUMENTATION_NODE,
      'both records must carry a stable error code: the start-up refusal and a failed request each report a code an operator can grep, and a class name does not survive minification',
    );
  }
  if (!/from '@\/lib\/errors\/app-error'/.test(instrumentationNode)) {
    finding(
      INSTRUMENTATION_NODE,
      'the code must come from the typed error (AppError.code), not from reading a message for a word that looks like a code',
    );
  }
  if (!/process\.exit\(1\)/.test(instrumentationNode)) {
    finding(
      INSTRUMENTATION_NODE,
      'an invalid configuration must end the process: throwing from the hook leaves the server answering 500s, which reads as a broken application rather than a refusal to start',
    );
  }
  for (const secret of ['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (instrumentationNode.includes(secret)) {
      finding(
        INSTRUMENTATION_NODE,
        `the start-up hook must not name ${secret}: the schema validates it, and a value that is never read cannot be logged`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The map, read as blocks
// ---------------------------------------------------------------------------

/**
 * The navigation map, as the two facts every rule below needs: which sections
 * belong to the public audience, and which destinations they publish.
 *
 * The map is parsed as text rather than imported because it is a `.ts` module
 * that imports React and its icon set - nothing a Node check can load - and
 * because a check that imported its expectation from the code it verifies would
 * only prove that the code equals itself.
 */
function parseMap(source) {
  const blocks = [];
  const start = source.indexOf('export const NAV_MAP');
  const text = start < 0 ? source : source.slice(start);
  const parts = text.split(/\n  \{\n/);
  for (const part of parts.slice(1)) {
    const id = /id: '([a-z0-9-]+)'/.exec(part);
    const audience = /audience: '([a-z]+)'/.exec(part);
    if (id === null || audience === null) {
      continue;
    }
    const entryParts = part.split(/\n      \{\n/);
    const hrefs = [];
    for (const entry of entryParts.slice(1)) {
      const href = /href: '([^']+)'/.exec(entry);
      if (href !== null) {
        hrefs.push(href[1]);
      }
    }
    blocks.push({ id: id[1], audience: audience[1], hrefs });
  }
  return blocks;
}

const navSource = requireFile(NAV_MAP, 'the navigation map is missing');
const map = navSource === null ? [] : parseMap(navSource);
const publicBlocks = map.filter((block) => block.audience === 'public');
if (publicBlocks.length === 0) {
  finding(
    NAV_MAP,
    'the map publishes no public section; the sitemap rules below have nothing to verify against',
  );
}
const publicHrefs = new Set(publicBlocks.flatMap((block) => block.hrefs));

// ---------------------------------------------------------------------------
// 5. The sitemap: every public section accounted for, once
// ---------------------------------------------------------------------------

const sitemapSource = requireFile(
  SITEMAP_MODULE,
  'lib/seo/sitemap.ts is missing; the sitemap would have to be hand-written, and a hand-written list is wrong the day a page is added',
);
if (sitemapSource !== null) {
  const sectionsAt = indexOf(sitemapSource, 'export const SITEMAP_SECTIONS');
  const excludedAt = indexOf(sitemapSource, 'export const SITEMAP_EXCLUDED_SECTIONS');
  const entriesAt = indexOf(sitemapSource, 'export interface SitemapEntry');
  if (sectionsAt < 0 || excludedAt < 0 || entriesAt < 0) {
    finding(
      SITEMAP_MODULE,
      'the module must declare the listed sections, the excluded sections and the entry shape',
    );
  } else {
    const listed = [
      ...sitemapSource.slice(sectionsAt, excludedAt).matchAll(/block: '([a-z0-9-]+)'/g),
    ].map((match) => match[1]);
    const excluded = [
      ...sitemapSource.slice(excludedAt, entriesAt).matchAll(/block: '([a-z0-9-]+)'/g),
    ].map((match) => match[1]);
    for (const id of listed) {
      if (!publicBlocks.some((block) => block.id === id)) {
        finding(
          SITEMAP_MODULE,
          `the sitemap lists the section ${id}, which is not a public section of the map: a sitemap entry with no page behind it is a broken URL in a crawler's queue`,
        );
      }
    }
    for (const id of excluded) {
      if (!publicBlocks.some((block) => block.id === id)) {
        finding(
          SITEMAP_MODULE,
          `the sitemap excludes the section ${id}, which is not a public section`,
        );
      }
    }
    for (const block of publicBlocks) {
      const inListed = listed.filter((id) => id === block.id).length;
      const inExcluded = excluded.filter((id) => id === block.id).length;
      if (inListed + inExcluded === 0) {
        finding(
          SITEMAP_MODULE,
          `the public section ${block.id} is in neither the sitemap nor the exclusion list: the day a section is added, its absence has to fail here rather than in a crawler`,
        );
      }
      if (inListed > 1 || inExcluded > 1 || (inListed === 1 && inExcluded === 1)) {
        finding(
          SITEMAP_MODULE,
          `the public section ${block.id} is decided more than once; one section makes one decision`,
        );
      }
    }
    const listedBody = sitemapSource.slice(sectionsAt, excludedAt);
    for (const id of listed) {
      const start = listedBody.indexOf(`block: '${id}'`);
      // The window stops at the next entry. A fixed character count reaches into
      // the neighbouring entry, and the neighbour's value then satisfies this
      // entry's rule: measured, not imagined - a rationale emptied out passed
      // every rule in this loop until the window was cut at the next block.
      const next = listedBody.indexOf("block: '", start + 1);
      const body = listedBody.slice(start, next === -1 ? listedBody.length : next);
      if (!/changeFrequency: '(weekly|monthly)'/.test(body)) {
        finding(
          SITEMAP_MODULE,
          `the section ${id} declares no change frequency: a crawler schedules from this value, and a wrong one teaches it to distrust the file`,
        );
      }
      if (!/priority: [0-9.]+/.test(body)) {
        finding(SITEMAP_MODULE, `the section ${id} declares no priority`);
      }
      // A quoted empty string is not a reason: the value has to be a sentence.
      if (!/rationale:\s*\n?\s*'[^']{20,}'/.test(body)) {
        finding(
          SITEMAP_MODULE,
          `the section ${id} states no reason for its frequency and priority; a number nobody can justify is a number nobody will maintain`,
        );
      }
    }
    const excludedBody = sitemapSource.slice(excludedAt, entriesAt);
    for (const id of excluded) {
      const start = excludedBody.indexOf(`block: '${id}'`);
      const next = excludedBody.indexOf("block: '", start + 1);
      const window = excludedBody.slice(start, next === -1 ? excludedBody.length : next);
      if (!/rationale:\s*\n?\s*'[^']{20,}'/.test(window)) {
        finding(
          SITEMAP_MODULE,
          `the excluded section ${id} states no reason; an exclusion without a reason is a page someone will list next week to be safe`,
        );
      }
    }
  }
  if (!/sitemapEntries\(\)/.test(sitemapSource) || !/NAV_MAP\.filter\(/.test(sitemapSource)) {
    finding(
      SITEMAP_MODULE,
      'the entries must be resolved from the navigation map, not hand-written',
    );
  }
}

const sitemapRoute = requireFile(
  SITEMAP_ROUTE,
  'app/sitemap.ts is missing: nothing serves /sitemap.xml',
);
if (sitemapRoute !== null) {
  if (!/sitemapEntries\(\)/.test(sitemapRoute)) {
    finding(SITEMAP_ROUTE, 'the route must build its list from lib/seo/sitemap.ts');
  }
  if (!/absoluteUrl\(/.test(sitemapRoute)) {
    finding(
      SITEMAP_ROUTE,
      'the route must produce absolute URLs: a sitemap location is a URL, and a relative one is rejected',
    );
  }
  for (const field of ['changeFrequency', 'priority']) {
    if (!sitemapRoute.includes(field)) {
      finding(SITEMAP_ROUTE, `the route must pass ${field} through; the section table decides it`);
    }
  }
}

// ---------------------------------------------------------------------------
// 6. Robots: a preview refuses everything, production refuses three paths
// ---------------------------------------------------------------------------

const robotsSource = requireFile(
  ROBOTS_MODULE,
  'lib/seo/robots.ts is missing; the refused paths would have no reason recorded beside them',
);
if (robotsSource !== null) {
  for (const path of ['/api/', '/_next/', '/gallery']) {
    if (!robotsSource.includes(`path: '${path}'`)) {
      finding(
        ROBOTS_MODULE,
        `the refused path ${path} is missing: this check names the three the product refuses, so removing one has to be a decision`,
      );
    }
  }
  const ruleCount = (robotsSource.match(/rationale:/g) ?? []).length;
  if (ruleCount < 3) {
    finding(ROBOTS_MODULE, 'every refused path carries the reason it is refused');
  }
  if (!/allowsCrawling: false/.test(robotsSource) || !/disallow: \['\/'\]/.test(robotsSource)) {
    finding(
      ROBOTS_MODULE,
      'a preview must refuse everything: a development deployment that invites a crawler competes with the real site for its own content',
    );
  }
  if (!/sitemapPath: null/.test(robotsSource)) {
    finding(
      ROBOTS_MODULE,
      'a preview must advertise no sitemap: a list of paths is what the refusal above was written to prevent being crawled',
    );
  }
  for (const href of publicHrefs) {
    for (const path of ['/api/', '/_next/', '/gallery']) {
      if (href === path || (path !== '/' && href.startsWith(path))) {
        finding(
          ROBOTS_MODULE,
          `the refused path ${path} is a live public page (${href}): a refusal must never hide a page the navigation publishes`,
        );
      }
    }
  }
}

const robotsRoute = requireFile(
  ROBOTS_ROUTE,
  'app/robots.ts is missing: nothing serves /robots.txt',
);
if (robotsRoute !== null) {
  if (!/robotsPolicy\(/.test(robotsRoute) || !/NODE_ENV === 'production'/.test(robotsRoute)) {
    finding(
      ROBOTS_ROUTE,
      'the route must choose the policy from the build environment, the same switch the header matrix uses',
    );
  }
  if (!/sitemapPath === null/.test(robotsRoute)) {
    finding(
      ROBOTS_ROUTE,
      'the route must write the sitemap line only when there is a sitemap to point at',
    );
  }
  if (!/absoluteUrl\(/.test(robotsRoute)) {
    finding(ROBOTS_ROUTE, 'the sitemap line must be an absolute URL, as the protocol requires');
  }
}

const siteSource = requireFile(
  SITE_MODULE,
  'lib/seo/site.ts is missing: the deployment origin has no single owner',
);
if (siteSource !== null && !/getEnv\(\)\.NEXT_PUBLIC_APP_URL/.test(siteSource)) {
  finding(
    SITE_MODULE,
    'the origin must come from the validated environment; a second copy of the address is a second address',
  );
}

// ---------------------------------------------------------------------------
// 7. The metadata baseline
// ---------------------------------------------------------------------------

const rootLayout = requireFile(ROOT_LAYOUT, 'the root layout is missing');
if (rootLayout !== null) {
  for (const [needle, message] of [
    [
      'metadataBase: new URL(siteUrl())',
      'metadataBase must be declared, or every relative social image resolves against the wrong origin',
    ],
    ["type: 'website'", 'the open graph block must declare the document type'],
    ['siteName:', 'the open graph block must name the site'],
    [
      "card: 'summary_large_image'",
      'the Twitter block must declare the card, or a share renders as a bare link',
    ],
    [
      'applicationName:',
      'the document must name the application, which is what an installed shortcut reads',
    ],
    ['index: true', 'the robots default must be stated; a page narrows it, it does not invent it'],
    ['follow: true', 'the robots default must be stated for following too'],
    [
      'telephone: false',
      'format detection must not turn a product name into a phone number on a device that guesses',
    ],
  ]) {
    if (!rootLayout.includes(needle)) {
      finding(ROOT_LAYOUT, `the metadata baseline is incomplete: ${message}`);
    }
  }
  if (!/export const viewport: Viewport/.test(rootLayout)) {
    finding(ROOT_LAYOUT, 'the document must declare its viewport');
  }
  for (const needle of ["width: 'device-width'", 'initialScale: 1', "colorScheme: 'light dark'"]) {
    if (!rootLayout.includes(needle)) {
      finding(ROOT_LAYOUT, `the viewport must declare ${needle}`);
    }
  }
  for (const theme of ['light', 'dark']) {
    if (!rootLayout.includes(`browserThemeColor('${theme}')`)) {
      finding(
        ROOT_LAYOUT,
        `the browser chrome must be painted for the ${theme} theme: a white address bar above a dark page is the seam a reader sees first`,
      );
    }
  }
  if (!/COLOR_THEME_VALUES/.test(rootLayout) || !/hslTripleToHex\(/.test(rootLayout)) {
    finding(
      ROOT_LAYOUT,
      'the theme colour must be resolved from the token module; a literal colour in the layout is a value no palette change reaches',
    );
  }
  if (/(#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()/.test(rootLayout)) {
    finding(ROOT_LAYOUT, 'the layout must declare no raw colour: every value resolves to a token');
  }
  if (!/PrintMarker/.test(rootLayout)) {
    finding(ROOT_LAYOUT, 'the root layout must mount the print marker');
  }
}

const ogRoute = requireFile(
  OG_IMAGE_ROUTE,
  'app/opengraph-image.tsx is missing: a shared link has no image',
);
if (ogRoute !== null) {
  if (!/buildDefaultOgImage\(\)/.test(ogRoute)) {
    finding(
      OG_IMAGE_ROUTE,
      'the route must serve the drawn social image from lib/seo/og-image.ts rather than a committed file',
    );
  }
  for (const field of ['export const alt', 'export const size', 'export const contentType']) {
    if (!ogRoute.includes(field)) {
      finding(OG_IMAGE_ROUTE, `the image convention requires ${field}`);
    }
  }
  if (!/t\('brand\.social_image_alt'\)/.test(ogRoute)) {
    finding(
      OG_IMAGE_ROUTE,
      'the alt text must be the brand catalogue string, so the sentence a network shows and the sentence a screen reader announces cannot drift',
    );
  }
}
const ogModule = readCode(OG_IMAGE_MODULE);
if (ogModule !== null && !/export async function renderDefaultOgImage/.test(ogModule)) {
  finding(
    OG_IMAGE_MODULE,
    'the social image module must keep the render seam the brand check reads',
  );
}

// ---------------------------------------------------------------------------
// 7b. The metadata baseline, and the rendering mode it forces
// ---------------------------------------------------------------------------

/**
 * Why the baseline is a module rather than a habit.
 *
 * The defect this rule exists for was measured, not imagined: a page that
 * declares its own `openGraph` inherits none of the site-wide block, so the
 * first production run of sub-step 1.30 served a landing page with an og:title
 * and no og:image. One page cannot be trusted to remember five tags, so the
 * composition lives in `lib/seo/metadata.ts` and every page goes through it -
 * and the rule below keeps the module complete, because the way this fails
 * again is an edit to the module rather than to a page.
 */
const metadataModule = requireFile(
  METADATA_MODULE,
  'lib/seo/metadata.ts is missing; every page would compose its own open graph block, and a page that writes one replaces the site-wide block rather than adding to it',
);
if (metadataModule !== null) {
  for (const [needle, message] of [
    [
      'canonical:',
      'the baseline must publish a canonical path, or two addresses for one page compete in a search result',
    ],
    ['siteName:', 'the baseline must name the site in the open graph block'],
    [
      'url: path',
      'the baseline must set og:url from the page path, and a relative path is what metadataBase resolves',
    ],
    [
      'images: [...SOCIAL_IMAGE_ENTRIES]',
      'the baseline must publish the social image, because a page that sets openGraph does not inherit the file convention tag',
    ],
    ["card: 'summary_large_image'", 'the baseline must declare the Twitter card'],
  ]) {
    if (!metadataModule.includes(needle)) {
      finding(METADATA_MODULE, `the metadata baseline is incomplete: ${message}`);
    }
  }
  if (!/absoluteUrl\(/.test(metadataModule)) {
    finding(
      METADATA_MODULE,
      'the Twitter image must be an absolute URL: the card is read off this origin',
    );
  }
}

const socialImage = requireFile(
  SOCIAL_IMAGE_MODULE,
  'lib/seo/social-image.ts is missing; the image path and its alt text would be written twice',
);
if (socialImage !== null) {
  if (!/SOCIAL_IMAGE_PATH = '\/opengraph-image'/.test(socialImage)) {
    finding(
      SOCIAL_IMAGE_MODULE,
      'the social image path must be the route the file convention publishes (app/opengraph-image.tsx serves /opengraph-image)',
    );
  }
  if (!/t\('brand\.social_image_alt'\)/.test(socialImage)) {
    finding(
      SOCIAL_IMAGE_MODULE,
      'the alt text must be the brand catalogue string, so the sentence a network shows and the sentence a screen reader announces cannot drift',
    );
  }
}

/**
 * The rendering mode, which is a security decision here rather than a caching
 * one (see the long note in app/layout.tsx). A prerendered document cannot carry
 * a per-request nonce, and the framework's own inline scripts would then be
 * refused by the policy - so the rule is: documents are rendered per request,
 * and the three routes that are not documents say out loud that they are static.
 */
if (rootLayout !== null && !/export const dynamic = 'force-dynamic'/.test(rootLayout)) {
  finding(
    ROOT_LAYOUT,
    'documents must be rendered per request: a prerendered document carries no nonce, and the nonce policy refuses the scripts the framework inlined into it',
  );
}
for (const route of [
  {
    file: SITEMAP_ROUTE,
    why: 'the sitemap is a file, generated from data that changes with a release',
  },
  {
    file: ROBOTS_ROUTE,
    why: 'robots.txt is a file, generated from data that changes with a release',
  },
  { file: OG_IMAGE_ROUTE, why: 'the social image is an image, not a document with scripts in it' },
]) {
  const text = readCode(route.file);
  if (text !== null && !/export const dynamic = 'force-static'/.test(text)) {
    finding(
      route.file,
      `this route must declare force-static against the per-request default: ${route.why}, and a crawler or a network should be served a file`,
    );
  }
}

// ---------------------------------------------------------------------------
// 8. The paper contract
// ---------------------------------------------------------------------------

const marker = requireFile(PRINT_MARKER, 'the print marker module is missing');
if (marker !== null) {
  if (!/export function PrintMarker\(/.test(marker)) {
    finding(PRINT_MARKER, 'the marker must be one exported component');
  }
  if (!/data-print="only"/.test(marker)) {
    finding(PRINT_MARKER, 'the marker must be a paper-only block');
  }
  if (!/className="px-gutter/.test(marker)) {
    finding(
      PRINT_MARKER,
      'the marker must sit on the page grid: a line at the edge of the sheet is a line a printer trims',
    );
  }
}

// ---------------------------------------------------------------------------
// 9. The server-only environment rule
// ---------------------------------------------------------------------------

/**
 * The server-only rule (FEATURE_LIST item 3199) is a rule about where a value
 * may be read, so it is enforced where the reads are: a file that a browser can
 * run may not read a server-only key, and a client component may not import the
 * environment module at all. A per-request scan cannot prove this - a leaked
 * value leaks in a bundle, and a bundle is a build artefact.
 */
const envSource = readCode(ENV_MODULE);
const serverOnlyKeys =
  envSource === null
    ? []
    : [
        ...(
          /export const SECRET_ENV_KEYS[^=]*=\s*\[([\s\S]*?)\]/.exec(envSource)?.[1] ?? ''
        ).matchAll(/'([A-Z0-9_]+)'/g),
      ].map((match) => match[1]);
if (serverOnlyKeys.length === 0) {
  finding(
    ENV_MODULE,
    'SECRET_ENV_KEYS declares no key; the server-only rule has nothing to enforce',
  );
}
const clientFacing = listTrackedFiles().filter(
  (file) =>
    (file.startsWith('app/') || file.startsWith('components/')) &&
    (file.endsWith('.ts') || file.endsWith('.tsx')),
);
let clientFiles = 0;
for (const file of clientFacing) {
  const text = readCode(file);
  if (text === null) {
    continue;
  }
  const isClient = /^\s*'use client';/m.test(text);
  if (isClient) {
    clientFiles += 1;
    if (/from '@\/lib\/env/.test(text)) {
      finding(
        file,
        'a client component must not import the environment module: the schema reads server-only keys, and a bundle is copied to the device',
      );
    }
  }
  for (const key of serverOnlyKeys) {
    if (new RegExp(`process\\.env\\.${key}\\b`).test(text)) {
      finding(
        file,
        `a file that reaches the browser reads the server-only key ${key}; the value belongs to lib/env alone`,
      );
    }
  }
  if (/process\.env\.SUPABASE_/.test(text)) {
    finding(
      file,
      'a Supabase key must be read through the validated schema, never from process.env in a page or a component',
    );
  }
}
if (clientFiles === 0) {
  finding(
    'app',
    'no client component was found; the server-only rule cannot be verified against a file that does not exist',
  );
}

reportResult(
  CHECK,
  findings,
  `middleware, instrumentation, sitemap, robots and the metadata baseline verified (${String(publicBlocks.length)} public sections decided once each in lib/seo/sitemap.ts, ${String(publicHrefs.size)} published destinations, the metadata baseline composed once for every page, documents rendered per request so the nonce reaches the scripts, ${String(serverOnlyKeys.length)} server-only keys refused outside lib/env, ${String(clientFiles)} client components checked)`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
