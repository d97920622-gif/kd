// path: scripts/checks/page-states.mjs
/**
 * check:page-states -- no blank page, and no state that cannot be used.
 *
 * FEATURE_LIST section D asks for four page states on every page and forbids the
 * blank one: a skeleton while data is on its way, an error with a retry, an
 * empty state with an action, a success state. MASTER_PROMPT adds the rules that
 * make them usable - a focus ring, an accessible name on every icon button, a
 * live region for anything that changes after load, and a page that works at 320
 * pixels.
 *
 * Those requirements are only satisfied if the *system* is right, because the
 * pages built on top of it in later steps will be built by copying it. So this
 * check verifies the system, not the pages:
 *
 *   1. **Every state exists and is a real component.** A missing state is a page
 *      that renders nothing when a fetch fails, and the failure mode of "nothing
 *      when the list is empty" is a reader who thinks their data is gone.
 *   2. **Each state announces itself, in the right voice.** Loading and success
 *      are polite; errors are assertive. Every announcement comes from the
 *      catalogue, so no state can ship an English sentence that was never
 *      reviewed as copy.
 *   3. **The error state can be acted on.** A retry control that is never
 *      disabled during a backoff is a control that hammers a broken service;
 *      an error with no reference is a support request nobody can act on; an
 *      error with no retry is a page the reader has to reload by hand.
 *   4. **Focus and names are inherited, not remembered.** The icon button takes
 *      its name as a required prop, and any `<Button size="icon">` written
 *      directly must carry an `aria-label` in its own opening tag.
 *   5. **The 320 pixel layer holds.** The breakpoint ladder is exactly the
 *      mandated one, our own stylesheets contain no desktop-first media query,
 *      and the utility that stops an unbroken token from forcing a horizontal
 *      scroll exists and is applied where references are rendered.
 *
 * Everything here is a static read, so it runs in a fresh clone with no browser
 * and no development server. The rendered side - that the gallery renders each
 * state in every theme - is measured by docs/EVIDENCE/step-01/gallery-dom-probe.py.
 */
import { listTrackedFiles, positionOf, reportResult, readTextFile } from './_lib.mjs';

const CHECK = 'page-states';
const STATES_DIR = 'components/shared/';
const STATES = [
  'components/shared/loading-state.tsx',
  'components/shared/status-state.tsx',
  'components/shared/success-state.tsx',
  'components/shared/error-boundary.tsx',
  'components/shared/state-illustration.tsx',
  'components/shared/live-region.tsx',
  'components/ui/icon-button.tsx',
  'lib/hooks/use-retry.ts',
];
const GALLERY = 'app/(dev)/gallery/showcase-states.tsx';
const GALLERY_PAGE = 'app/(dev)/gallery/page.tsx';
const GLOBALS = 'styles/globals.css';
const PRINT = 'styles/print.css';
const TAILWIND = 'tailwind.config.ts';
const A11Y_ROOTS = /^(app|components)\//;
/** The breakpoint ladder MASTER_PROMPT mandates, in order. */
const REQUIRED_SCREENS = {
  '2xs': '320px',
  xs: '375px',
  sm: '430px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1920px',
};
const findings = [];

function read(file) {
  return readTextFile(file);
}

function requireFile(file, message) {
  const text = read(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

function finding(file, message, source = null, index = 0) {
  const { line, column } = source === null ? { line: 1, column: 1 } : positionOf(source, index);
  findings.push({ file, line, column, message });
}

/** The opening tag of every element with a given tag name, as written. */
function openingTags(source, tagName) {
  return [...source.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'g'))].map((match) => ({
    text: match[0],
    index: match.index ?? 0,
  }));
}

// ---------------------------------------------------------------------------
// 1. Every state exists, and each one is the shape it claims to be
// ---------------------------------------------------------------------------

for (const file of STATES) {
  requireFile(file, 'the state system is incomplete: this module is missing');
}

const loading = read('components/shared/loading-state.tsx');
if (loading !== null) {
  for (const layout of ['table', 'list', 'form', 'card']) {
    if (!loading.includes(`'${layout}'`)) {
      finding(
        'components/shared/loading-state.tsx',
        `the loading state has no ${layout} layout; a page whose shape is not here is a page that will grow its own spinner`,
      );
    }
  }
  if (!/role="status"/.test(loading) || !/aria-live="polite"/.test(loading)) {
    finding(
      'components/shared/loading-state.tsx',
      'the loading region must announce itself politely: a reader who is told nothing hears a page that is still arriving as a page that has nothing on it',
    );
  }
  if (!/sr-only/.test(loading)) {
    finding(
      'components/shared/loading-state.tsx',
      'the announcement must be visually hidden: the shapes below it are the visible half of the message',
    );
  }
  if (!/Math\.max\(1, Math\.min\(rows/.test(loading)) {
    finding(
      'components/shared/loading-state.tsx',
      'the row count must be clamped: a caller passing a page size of 500 must not render 500 skeletons',
    );
  }
}

const status = read('components/shared/status-state.tsx');
if (status !== null) {
  for (const exportName of ['StatusState', 'ErrorState']) {
    if (!new RegExp(`export function ${exportName}\\b`).test(status)) {
      finding('components/shared/status-state.tsx', `the state family must export ${exportName}`);
    }
  }
  if (!/role=\{live === 'off' \? undefined : 'status'\}/.test(status)) {
    finding(
      'components/shared/status-state.tsx',
      'the state must be able to leave the live region off: a state that is the whole page does not need to interrupt, and one that replaced content does',
    );
  }
  if (!/aria-live/.test(status) || !/aria-atomic/.test(status)) {
    finding(
      'components/shared/status-state.tsx',
      'a state that arrives after load must be announced whole, not word by word',
    );
  }
  if (!/tPlural\('states\.label_error_attempts'/.test(status)) {
    finding(
      'components/shared/status-state.tsx',
      'the attempt count must be a pluralised sentence: "1 attempts so far" is how a reader learns the product does not read its own messages',
    );
  }
  // The leading whitespace matters: without it, `aria-disabled=` also matches,
  // and an aria-only attribute leaves the control clickable.
  if (!/\sdisabled=\{waiting \|\| onRetry === undefined\}/.test(status)) {
    finding(
      'components/shared/status-state.tsx',
      'the retry control must carry a real disabled attribute while a backoff is waiting and when no retry handler exists; aria-disabled alone leaves it clickable',
    );
  }
  // The reference is read out of the error state's own block: a file-level test
  // would be satisfied by the empty state's reference, which is a different
  // element in a different situation.
  const errorBlock = /export function ErrorState\b[\s\S]*$/.exec(status);
  if (errorBlock === null) {
    finding('components/shared/status-state.tsx', 'ErrorState was not found in the module');
  } else {
    const codes = openingTags(errorBlock[0], 'code');
    if (codes.length === 0) {
      finding(
        'components/shared/status-state.tsx',
        'the error state must render the reference a support request can quote',
      );
    }
    for (const code of codes) {
      if (!/wrap-anywhere/.test(code.text)) {
        finding(
          'components/shared/status-state.tsx',
          'a reference code is an unbroken token: it must render inside the 320 pixel wrap guard or it forces a horizontal scrollbar on a phone',
          errorBlock[0],
          code.index,
        );
      }
    }
  }
}

for (const file of ['components/shared/status-state.tsx', 'components/shared/success-state.tsx']) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  for (const tag of openingTags(text, 'h2')) {
    if (!/className=/.test(tag.text)) {
      finding(file, 'every state heading must carry the type styles it is designed with');
    }
  }
}

const success = read('components/shared/success-state.tsx');
if (success !== null) {
  if (!/^'use client';/m.test(success)) {
    finding(
      'components/shared/success-state.tsx',
      'the countdown owns a timer, so the component must be a client module',
    );
  }
  if (!/role="status"/.test(success) || !/aria-live="polite"/.test(success)) {
    finding(
      'components/shared/success-state.tsx',
      'a success that appears after a save must announce itself politely',
    );
  }
  if (!/tPlural\('states\.label_success_redirect'/.test(success)) {
    finding(
      'components/shared/success-state.tsx',
      'the countdown must be announced as a sentence that counts, not as a bare number',
    );
  }
  if (!/data-page-state-stay/.test(success) || !/data-page-state-continue/.test(success)) {
    finding(
      'components/shared/success-state.tsx',
      'a redirect that cannot be stopped takes a decision away from the reader: both a continue and a stay control are required',
    );
  }
  if (!/clearTimeout/.test(success)) {
    finding(
      'components/shared/success-state.tsx',
      'the timer must be cleared: a countdown that survives unmount navigates a page that no longer exists',
    );
  }
}

const boundary = read('components/shared/error-boundary.tsx');
if (boundary !== null) {
  if (!/^'use client';/m.test(boundary)) {
    finding('components/shared/error-boundary.tsx', 'a boundary is client-side only');
  }
  if (!/class ErrorBoundary extends Component/.test(boundary)) {
    finding(
      'components/shared/error-boundary.tsx',
      'a render error is reported to a class component and to nothing else; a hook cannot catch it',
    );
  }
  for (const member of ['static getDerivedStateFromError', 'componentDidCatch', 'resetKey']) {
    if (!boundary.includes(member)) {
      finding('components/shared/error-boundary.tsx', `the boundary must handle ${member}`);
    }
  }
  if (!/newShortReference\('ERR'\)/.test(boundary)) {
    finding(
      'components/shared/error-boundary.tsx',
      'every caught error needs its own short reference, built by the id module rather than by a counter',
    );
  }
  if (!/if \(!this\.state\.autoRetried\)\s*\{/.test(boundary)) {
    finding(
      'components/shared/error-boundary.tsx',
      'the automatic retry must be bounded by the guard `if (!this.state.autoRetried)`: re-rendering a deterministic failure is an infinite loop, not a recovery',
    );
  }
  if (/\bconsole\./.test(boundary)) {
    finding(
      'components/shared/error-boundary.tsx',
      'errors go to the structured logger through onError, never to the browser console',
    );
  }
  if (!/aria-live/.test(read('components/shared/status-state.tsx') ?? '')) {
    finding(
      'components/shared/error-boundary.tsx',
      'the fallback must announce itself: a panel that fails silently is a panel a screen reader still reads as working',
    );
  }
}

const retry = read('lib/hooks/use-retry.ts');
if (retry !== null) {
  if (!/2 \*\* Math\.max\(0, attempt - 1\)/.test(retry)) {
    finding(
      'lib/hooks/use-retry.ts',
      'the delay must double per attempt; a fixed delay is a fixed load on a service that is already failing',
    );
  }
  if (!/Math\.min\(maxDelayMs/.test(retry)) {
    finding('lib/hooks/use-retry.ts', 'the doubling must stop at a ceiling');
  }
  if (!/Math\.random\(\)/.test(retry)) {
    finding(
      'lib/hooks/use-retry.ts',
      'the wait needs jitter, or every client that failed together returns together',
    );
  }
  if (!/if \(next > maxAttempts\)\s*\{/.test(retry) || !/setExhausted\(true\)/.test(retry)) {
    finding(
      'lib/hooks/use-retry.ts',
      'the attempt budget must be a real branch that stops the loop and reports it',
    );
  }
  if (!/clearTimeout\(timer\)/.test(retry)) {
    finding('lib/hooks/use-retry.ts', 'every scheduled wait must be cleared on unmount');
  }
}

const illustration = read('components/shared/state-illustration.tsx');
if (illustration !== null) {
  if (!/aria-hidden="true"/.test(illustration)) {
    finding(
      'components/shared/state-illustration.tsx',
      'an illustration is decoration: it must be hidden from assistive technology, because the heading beside it is the information',
    );
  }
  if (!/currentColor/.test(illustration)) {
    finding(
      'components/shared/state-illustration.tsx',
      'the drawing must inherit the current colour, so it follows the palette in every theme instead of hard-coding one',
    );
  }
  for (const kind of ['empty', 'error', 'permission', 'offline']) {
    if (!illustration.includes(`'${kind}'`)) {
      finding(
        'components/shared/state-illustration.tsx',
        `the illustration set has no ${kind} drawing`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Accessibility primitives
// ---------------------------------------------------------------------------

const iconButton = read('components/ui/icon-button.tsx');
if (iconButton !== null) {
  if (!/readonly labelKey: EnglishStringKey/.test(iconButton)) {
    finding(
      'components/ui/icon-button.tsx',
      'the accessible name must be a required catalogue key: an icon button without a name must not compile',
    );
  }
  if (!/aria-label=\{label\}/.test(iconButton)) {
    finding('components/ui/icon-button.tsx', 'the icon button must carry the resolved label');
  }
  if (!/aria-hidden="true"/.test(iconButton)) {
    finding(
      'components/ui/icon-button.tsx',
      'the drawing is decoration; the accessible name is the label, and an exposed icon doubles every control list a screen reader reads',
    );
  }
  if (!/size="icon"/.test(iconButton)) {
    finding(
      'components/ui/icon-button.tsx',
      'an icon button is the 44 pixel target the design system mandates, not a small control',
    );
  }
}

const liveRegion = read('components/shared/live-region.tsx');
if (liveRegion !== null) {
  if (!/role=\{level === 'assertive' \? 'alert' : 'status'\}/.test(liveRegion)) {
    finding(
      'components/shared/live-region.tsx',
      'the live region must set both the role and the attribute: readers differ in which one they honour',
    );
  }
  if (!/aria-atomic="true"/.test(liveRegion)) {
    finding('components/shared/live-region.tsx', 'the announcement must be read whole');
  }
}

// A `<Button size="icon">` written directly is allowed, but it must name itself
// in its own opening tag. The rule reads each element rather than the file, so a
// name on one button can never answer for another.
for (const file of listTrackedFiles()) {
  if (!A11Y_ROOTS.test(file) || !/\.tsx$/.test(file)) {
    continue;
  }
  if (file === 'components/ui/icon-button.tsx') {
    continue;
  }
  const text = read(file);
  if (text === null) {
    continue;
  }
  for (const tag of openingTags(text, 'Button')) {
    if (!/size="icon"/.test(tag.text)) {
      continue;
    }
    if (!/aria-label=/.test(tag.text)) {
      finding(
        file,
        'an icon button must carry its accessible name: MASTER_PROMPT requires an aria-label on every icon button, and this one has none',
        text,
        tag.index,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. The 320 pixel layer
// ---------------------------------------------------------------------------

const globals = read(GLOBALS);
if (globals !== null) {
  if (!/\.wrap-anywhere\s*\{[^}]*overflow-wrap:\s*anywhere;/.test(globals)) {
    finding(
      GLOBALS,
      'the wrap guard is missing: without it a single unbroken reference or address is wider than a 320 pixel column',
    );
  }
}

for (const file of [GLOBALS, PRINT]) {
  const text = read(file);
  if (text === null) {
    continue;
  }
  const stripped = text.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const match of stripped.matchAll(/@media[^{]*max-width[^{]*\{/g)) {
    finding(
      file,
      'our own stylesheets must be mobile-first: a max-width media query is a rule written for the desktop and patched for the phone',
      stripped,
      match.index ?? 0,
    );
  }
}

const tailwind = read(TAILWIND);
if (tailwind !== null) {
  const block = /screens:\s*\{([\s\S]*?)\}/.exec(tailwind);
  const declared =
    block === null
      ? new Map()
      : new Map(
          [...block[1].matchAll(/'?([a-z0-9]+)'?:\s*'([^']+)'/g)].map((match) => [
            match[1],
            match[2],
          ]),
        );
  for (const [name, value] of Object.entries(REQUIRED_SCREENS)) {
    const actual = declared.get(name);
    if (actual === undefined) {
      finding(TAILWIND, `the breakpoint ${name} (${value}) is missing from the screens ladder`);
    } else if (actual !== value) {
      finding(
        TAILWIND,
        `the breakpoint ${name} is ${actual}, and the mandated ladder says ${value}`,
      );
    }
  }
  for (const name of declared.keys()) {
    if (!Object.prototype.hasOwnProperty.call(REQUIRED_SCREENS, name)) {
      finding(
        TAILWIND,
        `the breakpoint ${name} is not in the mandated ladder; a responsive system with invented steps is a system nobody can reason about`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 4. The system is actually rendered somewhere
// ---------------------------------------------------------------------------

const gallery = requireFile(GALLERY, 'the gallery does not show the page-state system');
if (gallery !== null) {
  for (const used of [
    'LoadingState',
    'StatusState',
    'ErrorState',
    'SuccessState',
    'ErrorBoundary',
    'IconButton',
    'LiveRegion',
  ]) {
    if (!new RegExp(`<${used}\\b`).test(gallery)) {
      finding(
        GALLERY,
        `the gallery must render ${used}: a state nobody has seen is a state nobody has reviewed`,
      );
    }
  }
  for (const kind of ['empty', 'permission']) {
    if (!gallery.includes(`kind="${kind}"`)) {
      finding(GALLERY, `the gallery must show the ${kind} empty variant`);
    }
  }
}

const galleryPage = read(GALLERY_PAGE);
if (galleryPage !== null && !/<ShowcaseStates\b/.test(galleryPage)) {
  finding(
    GALLERY_PAGE,
    'the page-state showcase is not mounted in the gallery, so its markers are in no theme',
  );
}

// A state component may not be the one place a state is missing: the four state
// files must not be imported by nothing, which is what a rename leaves behind.
const tracked = listTrackedFiles();
const trackedTsx = tracked.filter((file) => /\.tsx$/.test(file));
for (const file of trackedTsx) {
  if (!file.startsWith(STATES_DIR)) {
    continue;
  }
  const base = file.slice(STATES_DIR.length).replace(/\.tsx$/, '');
  const importPattern = new RegExp(`from '@/components/shared/${base}'|from '\\./${base}'`);
  const consumers = trackedTsx.filter((candidate) => {
    if (candidate === file) {
      return false;
    }
    const text = read(candidate);
    return text !== null && importPattern.test(text);
  });
  if (consumers.length === 0) {
    finding(
      file,
      `nothing imports this state module; a state that no page can render is a state that does not exist`,
    );
  }
}

reportResult(
  CHECK,
  findings,
  `${String(STATES.length)} state and accessibility modules verified (announced, actionable, named), breakpoint ladder 320 to 1920 exact, no desktop-first media query, ${GLOBALS} carries the wrap guard`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
