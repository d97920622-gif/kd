// path: scripts/checks/web-hardening.mjs
/**
 * check:web-hardening -- the response headers, the sanitizer, the Trusted Types
 * policy and the sign-out clear signal.
 *
 * Sub-step 1.26 ships a security baseline whose entire value is that it applies
 * to *every* response and every future call site, which also makes it the kind
 * of code that is never noticed when it is removed: no page breaks, no test
 * fails, nothing visible changes. So the check's job here is (a) that each
 * mechanism is present and shaped the way the ADR says it is, and (b) that the
 * things a later step could do to weaken it are refused by name.
 *
 * Eight groups:
 *
 *   1. **The header matrix** - the required headers with their required values,
 *      every entry carrying a rationale and a failure mode, and exactly three
 *      production-only entries.
 *   2. **The permissions list** - every feature that is refused is refused with
 *      an empty allowlist, exactly three are granted to `self`, and each grant
 *      has a consumer named in the rationale. A capability granted without a
 *      reason is how a product ends up asking for a camera it never wanted.
 *   3. **The consumer** - `next.config.js` applies the matrix to `/:path*` for
 *      every response and holds no header value of its own, and it picks the
 *      matrix from `NODE_ENV` rather than from anything a request can carry.
 *   4. **The sanitizer** - an allowlist rather than a blocklist, an inert
 *      parser rather than a live element, attributes filtered by name and by
 *      prefix, URL schemes checked after stripping scheme noise, no `style`
 *      attribute and no `<style>` element allowed through, and a refusal rather
 *      than a passthrough when no parser exists.
 *   5. **The Trusted Types policy** - the policy name, the two functions it
 *      declares, and the one it must not.
 *   6. **The sign-out signal** - the Clear-Site-Data value, the TLS guard, and
 *      the event a data-holding hook subscribes to.
 *   7. **Nothing inlined or hand-wired** - no `dangerouslySetInnerHTML` in
 *      application code, no raw `<script>` or `<link>` element written by hand,
 *      and no `next/script` import: each one is a hole in a policy that is
 *      otherwise enforced by data.
 *   8. **The record** - the ADR exists and states the decisions the check
 *      verifies, and the gallery renders the three specimens, because a
 *      hardening baseline that no page shows is a baseline that no reviewer has
 *      ever read.
 *
 * Everything here is static. The headers as *sent* are read from a running
 * server by docs/EVIDENCE/step-01/http-hardening-probe.py.
 */
import {
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const CHECK = 'web-hardening';
const MATRIX_FILE = 'config/security-headers.ts';
const NEXT_CONFIG = 'next.config.js';
const SANITIZER = 'lib/security/sanitizer.ts';
const TRUSTED_TYPES = 'lib/security/trusted-types.ts';
const LOGOUT = 'lib/security/logout.ts';
const BARREL = 'lib/security/index.ts';
const RUNTIME = 'components/security/security-runtime.tsx';
const ROOT_LAYOUT = 'app/layout.tsx';
const EN_CATALOGUE = 'lib/i18n/strings/en.ts';
const SECURITY_COPY = 'lib/i18n/strings/en/security.ts';
const ADR = 'docs/ADR/ADR-0006-web-hardening-baseline.md';
const GALLERY = 'app/(dev)/gallery/showcase-security.tsx';
const GALLERY_PAGE = 'app/(dev)/gallery/page.tsx';

/** Headers that must be present in every environment, with their values. */
const REQUIRED_ALWAYS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

/** Headers that apply on the deployed HTTPS origin only, with their values. */
const REQUIRED_IN_PRODUCTION = {
  'Content-Security-Policy': "frame-ancestors 'none'",
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

/** Device capabilities the product does use, each narrowed to this origin. */
const GRANTED_FEATURES = [
  'clipboard-write',
  'fullscreen',
  'publickey-credentials-create',
  'publickey-credentials-get',
];

/** The three Clear-Site-Data targets, which the specification defines exactly. */
const CLEAR_SITE_DATA_VALUE = '"cache", "cookies", "storage"';

const findings = [];

function read(file) {
  return readTextFile(file);
}

function finding(file, message, source = null, index = 0) {
  const { line, column } = source === null ? { line: 1, column: 1 } : positionOf(source, index);
  findings.push({ file, line, column, message });
}

/** The element names the allowlist keeps, read from the record literal. */
function SAFE_ELEMENT_KEYS(source) {
  const record = /export const SAFE_ELEMENTS:[\s\S]*?\n\};/.exec(source);
  if (record === null) {
    return {};
  }
  const keys = {};
  for (const match of record[0].matchAll(/^\s{2}([a-z][a-z0-9]*):\s*\[/gm)) {
    keys[match[1]] = true;
  }
  return keys;
}

/** The body of the forbidden element list, for the overlap rule. */
function FORBIDDEN_LIST(source) {
  const list = /export const FORBIDDEN_ELEMENTS:[\s\S]*?\n\];/.exec(source);
  return list === null ? '' : list[0];
}

function requireFile(file, message) {
  const text = read(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

// ---------------------------------------------------------------------------
// 1. The header matrix: one entry per header, with a reason and an environment
// ---------------------------------------------------------------------------

/** One `{ name: '...', value: '...', environment: '...' }` entry. */
function parseEntries(text) {
  const entries = [];
  const pattern = /\{\s*name:\s*'([^']+)',\s*value:\s*([\s\S]*?),\s*environment:\s*'([^']+)',/g;
  for (const match of text.matchAll(pattern)) {
    entries.push({
      name: match[1],
      rawValue: match[2].trim(),
      value: literalString(match[2]),
      environment: match[3],
      index: match.index ?? 0,
    });
  }
  return entries;
}

/**
 * The string a raw initializer evaluates to, for the cases the matrix uses: a
 * single-quoted literal, or several of them joined with `+` because the value is
 * longer than the formatter will keep on one line.
 */
function literalString(raw) {
  const parts = [...raw.matchAll(/'([^']*)'|"([^"]*)"/g)].map((match) => match[1] ?? match[2]);
  return parts.join('');
}

const matrix = requireFile(
  MATRIX_FILE,
  'the header matrix is missing: nothing states what this application sends',
);
const entries = matrix === null ? [] : parseEntries(matrix);
const byName = new Map(entries.map((entry) => [entry.name, entry]));

if (matrix !== null) {
  for (const [name, value] of Object.entries({ ...REQUIRED_ALWAYS, ...REQUIRED_IN_PRODUCTION })) {
    const entry = byName.get(name);
    if (entry === undefined) {
      finding(MATRIX_FILE, `the header matrix is missing ${name}`);
      continue;
    }
    if (entry.value !== value) {
      finding(
        MATRIX_FILE,
        `${name} must be ${JSON.stringify(value)}, found ${JSON.stringify(entry.value)}`,
        matrix,
        entry.index,
      );
    }
  }
  for (const entry of entries) {
    if (entry.environment !== 'all' && entry.environment !== 'production') {
      finding(
        MATRIX_FILE,
        `${entry.name} declares environment ${JSON.stringify(entry.environment)}, which is not one of the two the matrix supports`,
        matrix,
        entry.index,
      );
    }
    if (entry.name === 'Permissions-Policy') {
      continue;
    }
    if (entry.value.trim().length === 0) {
      finding(MATRIX_FILE, `${entry.name} declares no value`, matrix, entry.index);
    }
  }
  // Every entry carries its reason. A header without one is a header the next
  // person deletes when it breaks an embed. The count is taken inside the array
  // body, because the interface above it declares the same two field names once.
  const matrixBody = matrix.slice(
    matrix.indexOf('export const SECURITY_HEADERS'),
    matrix.indexOf('export const SECURITY_HEADER_SOURCE'),
  );
  const rationales = (matrixBody.match(/rationale:/g) ?? []).length;
  const failureModes = (matrixBody.match(/failureMode:/g) ?? []).length;
  for (const [label, count] of [
    ['rationale', rationales],
    ['failureMode', failureModes],
  ]) {
    if (count < entries.length) {
      finding(
        MATRIX_FILE,
        `every header needs a ${label}; ${String(entries.length)} headers declare ${String(count)}`,
      );
    }
  }
  const productionOnly = entries.filter((entry) => entry.environment === 'production');
  const expectedProductionOnly = Object.keys(REQUIRED_IN_PRODUCTION);
  const extra = productionOnly.filter((entry) => !expectedProductionOnly.includes(entry.name));
  if (extra.length > 0) {
    finding(
      MATRIX_FILE,
      `${extra.map((entry) => entry.name).join(', ')} may not be production only: the development exception is exactly the three headers the ADR names`,
    );
  }
  if (productionOnly.length < expectedProductionOnly.length) {
    finding(
      MATRIX_FILE,
      'a production-only header has been moved into every environment; the development exception has to stay enumerated',
    );
  }
  if (!/export type SecurityHeaderEnvironment = 'all' \| 'production';/.test(matrix)) {
    finding(MATRIX_FILE, 'the environment union must stay exactly two values');
  }
  if (!/export const SECURITY_HEADER_SOURCE = '\/:path\*';/.test(matrix)) {
    finding(
      MATRIX_FILE,
      'the matrix must be attached to every response: a header that covers documents but not the files they load has a hole in it',
    );
  }
  if (!/export function securityHeadersFor\(/.test(matrix)) {
    finding(MATRIX_FILE, 'the matrix must expose one function that selects for an environment');
  }
  if (!/securityHeadersFor\(/.test(matrix) || !/environment === 'production'/.test(matrix)) {
    finding(
      MATRIX_FILE,
      'the selector must filter on the production environment, or the three production-only headers never ship',
    );
  }
  // The selector may not resolve a request-dependent value: these are static
  // values, and a header that changes per request belongs to middleware in 1.30.
  if (
    /request|headers\(\)|nonce/i.test(
      matrix.slice(matrix.indexOf('export function securityHeadersFor')),
    )
  ) {
    finding(
      MATRIX_FILE,
      'the matrix selector must not read a request: request-dependent policy is built where the request is handled',
    );
  }
}

// ---------------------------------------------------------------------------
// 2. Permissions-Policy: refuse by default, grant with a reason
// ---------------------------------------------------------------------------

if (matrix !== null) {
  const permissions = byName.get('Permissions-Policy');
  if (permissions !== undefined) {
    const directives = permissions.value.split(',').map((part) => part.trim());
    const refused = [];
    const granted = new Map();
    for (const directive of directives) {
      const [feature, allowlist] = directive.split('=');
      if (feature === undefined || allowlist === undefined) {
        finding(
          MATRIX_FILE,
          `Permissions-Policy directive ${JSON.stringify(directive)} is not a feature and an allowlist`,
          matrix,
          permissions.index,
        );
        continue;
      }
      if (allowlist === '()') {
        refused.push(feature);
      } else {
        granted.set(feature, allowlist);
      }
    }
    if (refused.length < 10) {
      finding(
        MATRIX_FILE,
        `Permissions-Policy refuses only ${String(refused.length)} features; the product does not use most device capabilities and must say so`,
      );
    }
    for (const feature of GRANTED_FEATURES) {
      if (granted.get(feature) !== '(self)') {
        finding(
          MATRIX_FILE,
          `Permissions-Policy must grant ${feature} to this origin only, found ${JSON.stringify(granted.get(feature))}`,
          matrix,
          permissions.index,
        );
      }
    }
    for (const feature of granted.keys()) {
      if (!GRANTED_FEATURES.includes(feature)) {
        finding(
          MATRIX_FILE,
          `Permissions-Policy grants ${feature}, which no consumer in this product needs; a capability granted without a reason is one that gets used without one`,
          matrix,
          permissions.index,
        );
      }
    }
    if (!/clipboard-write/.test(permissions.value)) {
      finding(
        MATRIX_FILE,
        'the copy control on a failure report writes to the clipboard, so the policy has to decide about clipboard write rather than leave it unstated',
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. The consumer: next.config.js applies the data and holds no values
// ---------------------------------------------------------------------------

const nextConfig = requireFile(
  NEXT_CONFIG,
  'the Next.js configuration is missing, so no header is ever sent',
);
if (nextConfig !== null) {
  if (!/require\('\.\/config\/security-headers\.ts'\)/.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the configuration must read the matrix from config/security-headers.ts, with the extension, so the values have one owner',
    );
  }
  if (!/async headers\(\)/.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the configuration must export a headers() function; without it the matrix is data nothing applies',
    );
  }
  if (!/securityHeadersFor\(environment\)/.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the configuration must build its list from securityHeadersFor(environment)',
    );
  }
  if (!/process\.env\.NODE_ENV === 'production'/.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the environment must come from NODE_ENV, which the build sets, rather than from anything a request can carry',
    );
  }
  const forbiddenValue =
    /key:\s*'(x-content-type-options|x-frame-options|cross-origin-[a-z-]+|permissions-policy|strict-transport-security|referrer-policy)'/i;
  if (forbiddenValue.test(nextConfig)) {
    finding(
      NEXT_CONFIG,
      'the configuration must not restate a header value; the matrix owns the values and this file owns the wiring',
    );
  }
  if (!/source: SECURITY_HEADER_SOURCE/.test(nextConfig)) {
    finding(NEXT_CONFIG, 'the header rule must use the source pattern from the matrix module');
  }
}

// ---------------------------------------------------------------------------
// 4. The sanitizer: an allowlist, an inert parser, and a refusal
// ---------------------------------------------------------------------------

const sanitizer = requireFile(
  SANITIZER,
  'the sanitizer is missing: nothing decides what markup survives',
);
if (sanitizer !== null) {
  if (!/new DOMParser\(\)\.parseFromString\(/.test(sanitizer)) {
    finding(
      SANITIZER,
      'the sanitizer must parse with DOMParser: assigning markup to a live element parses it as markup and can fetch what it names',
    );
  }
  if (/innerHTML\s*=/.test(sanitizer)) {
    finding(
      SANITIZER,
      'the sanitizer must not assign innerHTML anywhere; a single assignment makes the module a sink rather than a filter',
    );
  }
  const allowlist = /export const SAFE_ELEMENTS:[\s\S]*?\n\};/.exec(sanitizer);
  if (allowlist === null) {
    finding(
      SANITIZER,
      'the element allowlist must be a named record with one entry per kept element',
    );
  } else {
    const allowed = [...allowlist[0].matchAll(/^\s{2}([a-z][a-z0-9]*):\s*\[/gm)].map((m) => m[1]);
    if (allowed.length < 20) {
      finding(
        SANITIZER,
        `the allowlist keeps only ${String(allowed.length)} elements; it must be at least the 24 the ADR lists, because dropping one silently changes what an invoice note may contain`,
      );
    }
    for (const element of ['p', 'a', 'strong', 'em', 'ul', 'ol', 'li', 'code', 'table']) {
      if (!allowed.includes(element)) {
        finding(
          SANITIZER,
          `the allowlist must keep ${element}: it is the vocabulary rich text is written in`,
        );
      }
    }
    if (!/a:\s*\['href', 'title'\]/.test(allowlist[0])) {
      finding(SANITIZER, 'a link keeps exactly its URL and its title, and nothing else');
    }
  }
  // Nothing may appear on both lists: an element added to the allowlist while
  // the forbidden list still names it is an allowlist edit that silently
  // re-permits exactly what the module documents as refused.
  const overlap = Object.keys(SAFE_ELEMENT_KEYS(sanitizer)).filter((name) =>
    new RegExp(`'${name}'`).test(FORBIDDEN_LIST(sanitizer)),
  );
  if (overlap.length > 0) {
    finding(
      SANITIZER,
      `${overlap.join(', ')} appears in both the allowlist and the forbidden list; the allowlist is what the code keeps, so this re-permits an element the module documents as refused`,
    );
  }
  for (const element of ['script', 'iframe', 'object', 'embed', 'svg', 'math']) {
    if (!new RegExp(`'${element}'`).test(sanitizer)) {
      finding(
        SANITIZER,
        `the forbidden list must name ${element}, as documentation of what the allowlist refuses`,
      );
    }
  }
  if (!/FORBIDDEN_ATTRIBUTE_PREFIX = 'on'/.test(sanitizer)) {
    finding(
      SANITIZER,
      'event handlers must be refused by the on-prefix rather than by a list of handler names, which grows every year',
    );
  }
  if (
    !/SAFE_URL_SCHEMES: readonly string\[\] = \['http', 'https', 'mailto', 'tel'\]/.test(sanitizer)
  ) {
    finding(
      SANITIZER,
      'the URL scheme list must be exactly the four that can leave this origin safely; javascript, data and vbscript are the ones this refuses',
    );
  }
  if (!/SCHEME_NOISE =/.test(sanitizer) || !/replace\(SCHEME_NOISE, ''\)/.test(sanitizer)) {
    finding(
      SANITIZER,
      'the scheme test must strip the characters a browser ignores inside a scheme, or java\\tscript: passes a test that only reads the first character',
    );
  }
  if (!/if \(!canSanitize\(\)\) \{\s*return '';/.test(sanitizer)) {
    finding(
      SANITIZER,
      'without a parser the sanitizer must return empty rather than the input; a passthrough is the failure this module exists to prevent',
    );
  }
  if (
    !/parent\.replaceChild\(element\.ownerDocument\.createTextNode\(REMOVED_MARKER\), element\)/.test(
      sanitizer,
    )
  ) {
    finding(
      SANITIZER,
      'a removed element must be replaced with a marker: a refusal that renders as nothing is indistinguishable from a bug',
    );
  }
  if (!/Array\.from\(root\.querySelectorAll\('\*'\)\)/.test(sanitizer)) {
    finding(
      SANITIZER,
      'the walk must snapshot the element list before editing: removing a node while iterating a live result skips the node that follows it',
    );
  }
  if (!/element\.removeAttribute\(attribute\.name\)/.test(sanitizer)) {
    finding(SANITIZER, 'an attribute that is not on the allowlist must be removed');
  }
  if (!/name\.includes\(': '\)/.test(sanitizer) && !/name\.includes\(':'\)/.test(sanitizer)) {
    finding(
      SANITIZER,
      'namespaced attributes must be refused: xlink:href is how an SVG script is reached and the allowlist has no reason to keep one',
    );
  }
  if (!/if \(!isSafeUrl\(href\)\) \{/.test(sanitizer)) {
    finding(SANITIZER, 'a link must be checked before its href is kept');
  }
}

// ---------------------------------------------------------------------------
// 5. The Trusted Types policy
// ---------------------------------------------------------------------------

const trustedTypes = requireFile(TRUSTED_TYPES, 'the Trusted Types policy is missing');
if (trustedTypes !== null) {
  if (!/export const TRUSTED_TYPES_POLICY_NAME = 'kd-solution-it';/.test(trustedTypes)) {
    finding(
      TRUSTED_TYPES,
      'the policy must keep its name: a violation report names the policy, and a rename orphans every report',
    );
  }
  if (!/createHTML: \(input: string\) => policy\.createHtml\(input\)/.test(trustedTypes)) {
    finding(
      TRUSTED_TYPES,
      'createHTML must delegate to the sanitizer; a policy that returns its input launders arbitrary markup into a value the browser then trusts',
    );
  }
  if (
    !/createScriptURL: \(input: string\) => policy\.createScriptUrl\(input\)/.test(trustedTypes)
  ) {
    finding(TRUSTED_TYPES, 'createScriptURL must be declared and must accept only this origin');
  }
  if (/createScript:/i.test(trustedTypes.replace(/createScriptURL:/g, ''))) {
    finding(
      TRUSTED_TYPES,
      'createScript must not be declared: leaving it out is what makes a script sink throw instead of running a string',
    );
  }
  if (!/resolved\.origin !== window\.location\.origin/.test(trustedTypes)) {
    finding(
      TRUSTED_TYPES,
      'the script URL check must compare resolved origins, not string prefixes: evil.example passes a prefix test on the origin it is imitating',
    );
  }
  if (!/factory\.createPolicy\(TRUSTED_TYPES_POLICY_NAME/.test(trustedTypes)) {
    finding(TRUSTED_TYPES, 'the policy must be created with the browser through createPolicy');
  }
  if (!/declare global \{/.test(trustedTypes)) {
    finding(
      TRUSTED_TYPES,
      'the API surface this product uses must be declared narrowly, because the DOM library does not ship Trusted Types yet',
    );
  }
}

const runtime = requireFile(
  RUNTIME,
  'the security runtime is missing: no document ever declares the policy',
);
if (runtime !== null) {
  // The call, not the import: the import line already carries the identifier, so
  // a rule that looked for the name would pass on a module that imports the
  // installer and never runs it.
  if (!/installSecurityPolicy\(\);/.test(runtime)) {
    finding(RUNTIME, 'the runtime must install the policy');
  }
  if (!/useEffect\(/.test(runtime)) {
    finding(
      RUNTIME,
      'the install must run in an effect: a module-level side effect would run during server rendering, where there is no window',
    );
  }
  if (!/'use client';/.test(runtime)) {
    finding(RUNTIME, 'the runtime is browser code and must be a client component');
  }
}
const rootLayout = read(ROOT_LAYOUT);
if (rootLayout !== null && !/<SecurityRuntime \/>/.test(rootLayout)) {
  finding(
    ROOT_LAYOUT,
    'the root layout must mount SecurityRuntime once: createPolicy refuses a name that is already taken, so the policy is declared per document and not per page',
  );
}

// ---------------------------------------------------------------------------
// 6. The sign-out signal and the Clear-Site-Data guard
// ---------------------------------------------------------------------------

const logout = requireFile(
  LOGOUT,
  'the logout module is missing: signing out would leave cached data behind',
);
if (logout !== null) {
  if (!/CLEAR_SITE_DATA_HEADER_VALUE = '"cache", "cookies", "storage"'/.test(logout)) {
    finding(
      LOGOUT,
      `the header value must be exactly ${CLEAR_SITE_DATA_VALUE}, which is what the specification defines`,
    );
  }
  if (!/if \(url\.protocol !== 'https:'\) \{\s*return null;/.test(logout)) {
    finding(
      LOGOUT,
      'the header must be withheld on a request that did not arrive over TLS: browsers ignore it there, so sending it would make a reviewer believe a cache was cleared',
    );
  }
  if (!/catch \{\s*return null;/.test(logout)) {
    finding(
      LOGOUT,
      'an unparseable URL must refuse the header rather than throw during a sign-out',
    );
  }
  if (!/export function installLogoutClearSignal\(/.test(logout)) {
    finding(
      LOGOUT,
      'the signal must be subscribable with a returned unsubscribe function, which is the shape a React effect needs',
    );
  }
  if (!/window\.removeEventListener\(LOGOUT_SIGNAL_EVENT, handler\)/.test(logout)) {
    finding(
      LOGOUT,
      'the subscription must remove its own listener, or a component that mounts twice leaves a duplicate',
    );
  }
  const detail = /detail: \{([^}]*)\}/.exec(logout);
  if (detail === null || detail[1].trim() !== 'requested: options.requested ?? true') {
    finding(
      LOGOUT,
      'the signal must carry only whether the reader asked, and no user data: a payload that names what to clear is a second copy of the thing it is trying to delete',
    );
  }
  if (/localStorage|sessionStorage|document\.cookie/.test(logout)) {
    finding(
      LOGOUT,
      'the logout module must not touch storage itself: it announces what happened, and each holder clears what it owns',
    );
  }
}
const barrel = requireFile(
  BARREL,
  'the security barrel is missing, so the primitives have no agreed entry point',
);
if (barrel !== null) {
  if (
    !/from '@\/lib\/security\/sanitizer'/.test(barrel) ||
    !/from '@\/lib\/security\/trusted-types'/.test(barrel)
  ) {
    finding(BARREL, 'the barrel must re-export the sanitizer and the Trusted Types policy');
  }
  if (/from '@\/config\/security-headers'/.test(barrel)) {
    finding(
      BARREL,
      'the barrel must not re-export the header matrix: it is build-time data, and a component that imported it might believe a header list is an application concern',
    );
  }
}

// ---------------------------------------------------------------------------
// 7. Nothing inlined, nothing hand-wired
// ---------------------------------------------------------------------------

const tracked = listTrackedFiles();
const applicationCode = tracked.filter((file) =>
  /^(app|components|lib|config)\/.*\.(ts|tsx)$/.test(file),
);
for (const file of applicationCode) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  // Comments and string literals are blanked before the scan, with the offsets
  // preserved. A specimen string that contains a script element - which the
  // sanitizer's own gallery demonstration does, on purpose - is a string, and a
  // comment that explains why an element is refused is a comment. Neither is a
  // sink, and a check that cannot tell the difference trains a reader to add an
  // exclusion instead of reading the finding.
  const code = stripCommentsAndStrings(text);
  const sink = /dangerouslySetInnerHTML/.exec(code);
  if (sink !== null) {
    finding(
      file,
      'dangerouslySetInnerHTML is refused outright: markup that must be rendered as markup goes through the sanitizer and the Trusted Types policy, and everything else is rendered as text',
      text,
      sink.index,
    );
  }
  const script = /<script[\s>]/.exec(code);
  if (script !== null) {
    finding(
      file,
      'a hand-written script element is refused: it bypasses the nonce policy and, if it points anywhere but this origin, it needs an integrity attribute that only an ADR can justify',
      text,
      script.index,
    );
  }
  const link = /<link[\s>]/.exec(code);
  if (link !== null) {
    finding(
      file,
      'a hand-written link element is refused: stylesheets are imported, and a third-party resource needs SRI and its own ADR entry',
      text,
      link.index,
    );
  }
  const nextScript = /from 'next\/script'/.exec(text);
  if (nextScript !== null) {
    finding(
      file,
      'next/script loads a remote script without an integrity attribute; adopting one means recording the hash and the fallback in an ADR first',
      text,
      nextScript.index,
    );
  }
}
if (applicationCode.some((file) => file === 'components/security/turnstile.tsx')) {
  finding(
    'components/security/turnstile.tsx',
    'third-party embeds belong to the step that needs them, with an integrity decision',
  );
}

// ---------------------------------------------------------------------------
// 8. Copy, the gallery and the record
// ---------------------------------------------------------------------------

const catalogue = requireFile(EN_CATALOGUE, 'the English catalogue was not found');
if (catalogue !== null) {
  if (
    !/import \{ security \} from '\.\/en\/security'/.test(catalogue) ||
    !/^  security,$/m.test(catalogue)
  ) {
    finding(
      EN_CATALOGUE,
      'the security namespace must be registered: every refusal message is user facing copy',
    );
  }
}
const copy = requireFile(SECURITY_COPY, 'the security copy namespace is missing');
if (copy !== null) {
  for (const key of [
    'label_removed_link',
    'label_sanitizer_description',
    'label_hardening_description',
    'label_trusted_types_unsupported',
    'label_clearsite_withheld',
  ]) {
    if (!new RegExp(`${key}:`).test(copy)) {
      finding(
        SECURITY_COPY,
        `${key} must exist: a product that refuses something owes the reader a sentence about it`,
      );
    }
  }
}

const gallery = requireFile(
  GALLERY,
  'the gallery must show the hardening baseline, or it is a claim nobody has read',
);
if (gallery !== null) {
  for (const marker of [
    'data-security="sanitizer-input"',
    'data-security="sanitizer-output"',
    'data-security="header-matrix"',
    'data-security="trusted-types"',
    'data-security="clear-site-data"',
  ]) {
    if (!gallery.includes(marker)) {
      finding(GALLERY, `the gallery must carry ${marker}`);
    }
  }
  if (!/sanitizeHtml\(HOSTILE_INPUT\)/.test(gallery)) {
    finding(
      GALLERY,
      'the gallery must run the sanitizer on a hostile string: the specimen is the only place its behaviour is visible',
    );
  }
  if (/dangerouslySetInnerHTML/.test(stripCommentsAndStrings(gallery))) {
    finding(
      GALLERY,
      'the sanitized output must be rendered as text; inserting it as markup makes the gallery a second sink',
    );
  }
}
const galleryPage = read(GALLERY_PAGE);
if (galleryPage !== null && !/<ShowcaseSecurity\b/.test(galleryPage)) {
  finding(GALLERY_PAGE, 'the security showcase is not mounted in the gallery');
}

const adr = requireFile(
  ADR,
  'the web hardening decision must be recorded in docs/ADR/ADR-0006-web-hardening-baseline.md',
);
if (adr !== null) {
  for (const phrase of [
    'Content-Security-Policy: frame-ancestors',
    'require-corp',
    'Clear-Site-Data',
    'Trusted Types',
    'Subresource Integrity',
    'intersection',
    'Alternatives considered',
  ]) {
    if (!adr.includes(phrase)) {
      finding(ADR, `the ADR must state the decision about ${phrase}`);
    }
  }
}

reportResult(
  CHECK,
  findings,
  `${String(entries.length)} security headers verified (${String(Object.keys(REQUIRED_ALWAYS).length)} in every environment, ${String(Object.keys(REQUIRED_IN_PRODUCTION).length)} on the deployed origin), Permissions-Policy refuses by default with ${String(GRANTED_FEATURES.length)} named grants, sanitizer allowlist and Trusted Types policy shaped, Clear-Site-Data gated on TLS, no hand-written script or link in ${String(applicationCode.length)} application files`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
