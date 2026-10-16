// path: scripts/checks/usability.mjs
/**
 * check:usability -- the four primitives that every editing module inherits.
 *
 * docs/PLAN/09_REVISION_2_ADDITIONS.md puts saved views, undo, autosave and
 * optimistic updates in step 1 and says steps 5, 6, 13 and 14 apply them to
 * their own modules. That placement is the reason this check is strict: the
 * cost of a wrong decision here is not one screen, it is every screen that
 * copies the pattern, and the copies will be written by someone reading the
 * hook rather than this file.
 *
 * The rules follow the promises the copy makes to a reader:
 *
 *   1. **A stored draft or view is untrusted input.** The hooks read storage
 *      through the pure modules (`parseSavedViews`, `parseDraft`), never with a
 *      bare `JSON.parse`, and a stored payload is validated against the
 *      caller's schema before it is offered back.
 *   2. **The window is five seconds and it is a floor.** `UNDO_WINDOW_MS` is
 *      5000, `undoWindowMs` raises a shorter request instead of honouring it,
 *      and no hook contains the number itself.
 *   3. **Nothing is sent before the window closes.** The undo hook owns the
 *      pending action and the commit runs once, guarded by a settled set; the
 *      optimistic hook's `apply` shows a change without performing a request
 *      (the request is a separate call the undo window makes on commit).
 *   4. **A page exit is not a data loss event.** Both the undo hook and the
 *      toast pairing flush or commit on the way out, and both clear their
 *      timers.
 *   5. **Every state has a sentence.** The outcome unions are read out of the
 *      source and each member must appear as a case in the hook that renders
 *      its message, so a state added without copy fails here rather than
 *      showing an empty line to a reader.
 *   6. **A reason and its copy cannot drift apart.** The explainability reason
 *      list lives beside its sentences, and this check proves that every reason
 *      has all four sentences and that no sentence belongs to no reason.
 *   7. **The clock is read at the boundary.** The pure modules take `nowMs`,
 *      ids and storage keys as arguments and read no clock of their own, which
 *      is what lets docs/EVIDENCE/step-01/usability-probe.mjs exercise the
 *      decisions in Node; the storage key namespace has exactly one owner.
 *
 * Everything here is a static read with no browser and no server. The rendered
 * side is measured by docs/EVIDENCE/step-01/gallery-dom-probe.py, and the
 * decisions themselves by docs/EVIDENCE/step-01/usability-probe.mjs.
 */
import {
  listTrackedFiles,
  positionOf,
  readTextFile,
  reportResult,
  stripCommentsAndStrings,
} from './_lib.mjs';

const CHECK = 'usability';
const SAVED_VIEWS_PURE = 'lib/usability/saved-views.ts';
const SAVED_VIEWS_HOOK = 'lib/hooks/use-saved-views.ts';
const UNDO_PURE = 'lib/usability/undo-window.ts';
const UNDO_HOOK = 'lib/hooks/use-undo.ts';
const DRAFT_PURE = 'lib/usability/draft.ts';
const AUTOSAVE_HOOK = 'lib/hooks/use-autosave.ts';
const OPTIMISTIC_PURE = 'lib/usability/optimistic.ts';
const OPTIMISTIC_HOOK = 'lib/hooks/use-optimistic-record.ts';
const EXPLAINABILITY_PURE = 'lib/usability/explainability.ts';
const EXPLAINABILITY_COPY = 'lib/i18n/strings/en/explainability.ts';
const EXPLAINABILITY_COMPONENT = 'components/shared/explainability-message.tsx';
const USABILITY_COPY = 'lib/i18n/strings/en/usability.ts';
const EN_CATALOGUE = 'lib/i18n/strings/en.ts';
const GALLERY = 'app/(dev)/gallery/showcase-usability.tsx';
const GALLERY_PAGE = 'app/(dev)/gallery/page.tsx';
const ROOT_LAYOUT = 'app/layout.tsx';
const TOAST_HOOK = 'lib/hooks/use-toast.tsx';

/** The four sentences every explainability reason must carry. */
const EXPLAINABILITY_PARTS = ['headline', 'explanation', 'next', 'expected'];

/** Credential and card key names a draft may never store, lower-cased. */
const REQUIRED_DENIED_KEYS = [
  'password',
  'secret',
  'token',
  'cardnumber',
  'cvv',
  'iban',
  'accountnumber',
];

/** The data markers the gallery specimen must carry, one per primitive. */
const GALLERY_MARKERS = [
  'data-usability="saved-views"',
  'data-usability="undo"',
  'data-usability="autosave"',
  'data-usability="optimistic"',
  'data-usability="explainability"',
];

const findings = [];

function finding(file, message, source = null, index = 0) {
  const { line, column } = source === null ? { line: 1, column: 1 } : positionOf(source, index);
  findings.push({ file, line, column, message });
}

function requireFile(file, message) {
  const text = readTextFile(file);
  if (text === null) {
    finding(file, message);
    return null;
  }
  return text;
}

/** Fail when a phrase is absent from a required file. */
function expectIncludes(file, source, phrase, message) {
  if (source !== null && !source.includes(phrase)) {
    finding(file, message);
  }
}

/**
 * Fail when a pattern does not match. The pattern is anchored on the decision
 * itself - a call, an assignment, a returned expression - rather than on a
 * nearby word, because a rule that matches a comment or a declaration is a rule
 * that a mutation can satisfy without changing behaviour.
 */
function expectMatch(file, source, pattern, message) {
  if (source === null) {
    return;
  }
  if (!pattern.test(source)) {
    finding(file, message);
  }
}

/**
 * Fail when a pattern matches fewer than `count` times. Used where the promise
 * belongs to every path a value can leave by rather than to one line: a commit
 * that threw and a commit whose promise rejected have to be reported the same
 * way, and a rule anchored on one of the two calls would let the other one
 * swallow a failure.
 */
function expectAtLeast(file, source, pattern, count, message) {
  if (source === null) {
    return;
  }
  const matches = source.match(pattern) ?? [];
  if (matches.length < count) {
    const probe = new RegExp(pattern.source, pattern.flags.replace('g', ''));
    finding(file, message, source, Math.max(0, source.search(probe)));
  }
}

/**
 * The body of a declaration, from its first opening brace to the matching one.
 * Comments and string literals are blanked first, with offsets preserved, so a
 * brace inside a sentence cannot end the body early.
 */
function bodyOf(source, signature) {
  const stripped = stripCommentsAndStrings(source);
  const start = stripped.indexOf(signature);
  if (start === -1) {
    return null;
  }
  const open = stripped.indexOf('{', start);
  if (open === -1) {
    return null;
  }
  let depth = 0;
  for (let index = open; index < stripped.length; index += 1) {
    if (stripped[index] === '{') {
      depth += 1;
    } else if (stripped[index] === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(open, index + 1);
      }
    }
  }
  return null;
}

/** Members of a union type declared as a list of string literals. */
function unionMembers(source, typeName) {
  const pattern = new RegExp(`export type ${typeName} =([\\s\\S]*?);`);
  const match = pattern.exec(source);
  if (match === null) {
    return [];
  }
  return [...match[1].matchAll(/'([a-z_]+)'/g)].map((entry) => entry[1]);
}

/** `case 'x':` labels inside a source file. */
function caseLabels(source) {
  return new Set([...source.matchAll(/case '([a-z_]+)':/g)].map((entry) => entry[1]));
}

/** Top-level keys of a catalogue namespace literal. */
function catalogueKeys(source) {
  return new Set([...source.matchAll(/^ {2}([a-z][a-z0-9_]*):/gm)].map((entry) => entry[1]));
}

// ---------------------------------------------------------------------------
// 1. The files docs/PLAN/03 names, plus the client boundary
// ---------------------------------------------------------------------------

const savedViewsPure = requireFile(
  SAVED_VIEWS_PURE,
  'the saved views engine named by docs/PLAN/03 is missing',
);
const savedViewsHook = requireFile(SAVED_VIEWS_HOOK, 'use-saved-views is missing');
const undoPure = requireFile(UNDO_PURE, 'the undo window engine named by docs/PLAN/03 is missing');
const undoHook = requireFile(UNDO_HOOK, 'use-undo is missing');
const draftPure = requireFile(DRAFT_PURE, 'the draft engine behind use-autosave is missing');
const autosaveHook = requireFile(AUTOSAVE_HOOK, 'use-autosave is missing');
const optimisticPure = requireFile(OPTIMISTIC_PURE, 'the optimistic queue engine is missing');
const optimisticHook = requireFile(
  OPTIMISTIC_HOOK,
  'the optimistic update helper behind the queue is missing',
);
const explainabilityPure = requireFile(
  EXPLAINABILITY_PURE,
  'the explainability resolver is missing',
);
const explainabilityCopy = requireFile(
  EXPLAINABILITY_COPY,
  'the explainability copy namespace is missing',
);
const explainabilityComponent = requireFile(
  EXPLAINABILITY_COMPONENT,
  'components/shared/explainability-message.tsx is missing',
);
const usabilityCopy = requireFile(USABILITY_COPY, 'the usability copy namespace is missing');
const catalogueEntry = requireFile(EN_CATALOGUE, 'the string catalogue entry is missing');
const gallery = requireFile(GALLERY, 'the usability showcase is missing from the gallery');
const galleryPage = requireFile(GALLERY_PAGE, 'the gallery page is missing');
const rootLayout = requireFile(ROOT_LAYOUT, 'the root layout is missing');
const toastHook = requireFile(TOAST_HOOK, 'the toast surface is missing');

for (const [file, source] of [
  [SAVED_VIEWS_HOOK, savedViewsHook],
  [UNDO_HOOK, undoHook],
  [AUTOSAVE_HOOK, autosaveHook],
  [OPTIMISTIC_HOOK, optimisticHook],
]) {
  if (source !== null && !source.startsWith('// path:')) {
    finding(file, 'the file must start with its path comment');
  }
  expectMatch(
    file,
    source,
    /^'use client';$/m,
    'a hook that reads storage or a clock is a client module',
  );
}

for (const file of [
  SAVED_VIEWS_PURE,
  UNDO_PURE,
  DRAFT_PURE,
  OPTIMISTIC_PURE,
  EXPLAINABILITY_PURE,
]) {
  const source = readTextFile(file);
  if (source !== null && /^'use client';$/m.test(source)) {
    finding(
      file,
      'a pure engine must not carry the client directive: it has no React, no DOM and no clock, which is what lets the probe run it in Node',
    );
  }
  if (source !== null && /Date\.now\(\)/.test(source)) {
    finding(
      file,
      'the engine must take nowMs as an argument rather than read the clock, or the probe cannot decide anything about time',
    );
  }
}

/**
 * The four hook sources with comments and string literals blanked, for the
 * rules that ban a value or a call. A rule about a number must not fire on a
 * comment that explains the number, or the check teaches a reader to delete the
 * explanation instead of the code - the same lesson the motion and hardening
 * checks learned from their own specimens.
 */
const hookCode = new Map([
  [SAVED_VIEWS_HOOK, savedViewsHook === null ? null : stripCommentsAndStrings(savedViewsHook)],
  [UNDO_HOOK, undoHook === null ? null : stripCommentsAndStrings(undoHook)],
  [AUTOSAVE_HOOK, autosaveHook === null ? null : stripCommentsAndStrings(autosaveHook)],
  [OPTIMISTIC_HOOK, optimisticHook === null ? null : stripCommentsAndStrings(optimisticHook)],
]);

function hookCodeOf(file) {
  return hookCode.get(file) ?? null;
}

if (catalogueEntry !== null) {
  expectIncludes(
    EN_CATALOGUE,
    catalogueEntry,
    '  usability,',
    'the usability namespace must be registered in lib/i18n/strings/en.ts',
  );
  expectIncludes(
    EN_CATALOGUE,
    catalogueEntry,
    '  explainability,',
    'the explainability namespace must be registered in lib/i18n/strings/en.ts',
  );
}

// ---------------------------------------------------------------------------
// 2. Saved views: one owner of the key, one parser of the bytes
// ---------------------------------------------------------------------------

if (savedViewsPure !== null) {
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /export const SAVED_VIEW_STORAGE_PREFIX = 'kd\.saved-views\.v1';/,
    'the storage namespace must be declared once, with a version, in the engine',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /export function savedViewsStorageKey\(/,
    'the storage key must be built by one function that can refuse an identifier',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /if \(!IDENTIFIER_PATTERN\.test\(ownerId\) \|\| !IDENTIFIER_PATTERN\.test\(listId\)\)/,
    'the key builder must validate the owner and the list before it builds a key',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /export function parseSavedViews\(raw: string \| null, keys: readonly string\[\]\)/,
    'the reader must take the caller allowlist, so a hand-edited payload cannot persist an undeclared key',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /if \(seen\.size >= MAX_FILTER_KEYS\)/,
    'the projection must stop at the declared key cap',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /return \{ views, outcome: 'limit_reached' \};/,
    'a full list must refuse rather than drop an older view',
  );
  expectMatch(
    SAVED_VIEWS_PURE,
    savedViewsPure,
    /const cleaned = value\.replace\(CONTROL_CHARACTER_PATTERN, ''\)\.slice\(0, MAX_FILTER_VALUE_LENGTH\);/,
    'a stored filter value must be stripped of control characters and capped',
  );
}

if (savedViewsHook !== null) {
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /savedViewsStorageKey\(ownerId, listId\)/,
    'the hook must build its key through the engine, from the owner and the list it was given',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /parseSavedViews\(stored\.value, keyList\)/,
    'stored bytes must be read through the engine parser',
  );
  if (/JSON\.parse\(/.test(hookCodeOf(SAVED_VIEWS_HOOK) ?? '')) {
    finding(
      SAVED_VIEWS_HOOK,
      'the hook must not parse storage itself: validation belongs in the engine',
    );
  }
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /typeof window === 'undefined'/,
    'the hook must refuse to touch storage outside a browser',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /installLogoutClearSignal\(/,
    'saved views must be cleared when the reader signs out: a shared device must not keep them',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /window\.addEventListener\('storage', onStorage\)/,
    'a second tab must see what the first one saved, or the list contradicts itself',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /projectFilterValues\(keyList, values\)/,
    'the caller declares the keys, and the hook projects onto them',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /readonly keys: readonly string\[\];/,
    'the allowlist must be a required option rather than a default',
  );
  expectMatch(
    SAVED_VIEWS_HOOK,
    savedViewsHook,
    /t\('usability\.saved_views_unavailable'\)/,
    'a browser that refuses storage must be reported in a sentence rather than thrown',
  );
}

if (savedViewsPure !== null && savedViewsHook !== null) {
  const outcomes = unionMembers(savedViewsPure, 'SavedViewOutcome');
  const labels = caseLabels(savedViewsHook);
  for (const outcome of outcomes) {
    if (!labels.has(outcome)) {
      finding(
        SAVED_VIEWS_HOOK,
        `the outcome "${outcome}" has no case in the message switch, so that state would show an empty line`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Undo: a five second floor, one commit, one timer
// ---------------------------------------------------------------------------

if (undoPure !== null) {
  expectMatch(
    UNDO_PURE,
    undoPure,
    /export const UNDO_WINDOW_MS = 5000;/,
    'the window is the five seconds FEATURE_LIST item 156 fixes',
  );
  expectMatch(
    UNDO_PURE,
    undoPure,
    /return Math\.min\(MAX_UNDO_WINDOW_MS, Math\.max\(UNDO_WINDOW_MS, Math\.round\(requested\)\)\);/,
    'a caller may extend the window, never shorten it',
  );
  expectMatch(
    UNDO_PURE,
    undoPure,
    /export function pushEntry\(/,
    'the pending windows must be capped by a function that returns what it pushed out',
  );
  expectMatch(
    UNDO_PURE,
    undoPure,
    /const overflow = sorted\.slice\(0, next\.length - MAX_PENDING_UNDOS\);/,
    'the oldest window is the one that overflows, so a new action never steals an older undo',
  );
}

if (undoHook !== null) {
  if (/\b5000\b/.test(hookCodeOf(UNDO_HOOK) ?? '')) {
    finding(
      UNDO_HOOK,
      'the window value belongs to the engine: a second copy is a second answer to how long a reader has',
      undoHook,
      undoHook.search(/\b5000\b/),
    );
  }
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /if \(settledRef\.current\.has\(id\)\) \{\s*return;\s*\}\s*settledRef\.current\.add\(id\);/,
    'the commit path must check the settled set and mark the action before it is carried out, so no path can commit it twice',
  );
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /const timer = window\.setTimeout\(runExpired, Math\.max\(0, expiry - now\)\);/,
    'one timer is armed for the soonest expiry',
  );
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /window\.clearTimeout\(timer\)/,
    'the timer must be cleared, or a late window commits after the component is gone',
  );
  if (/setInterval\(/.test(hookCodeOf(UNDO_HOOK) ?? '')) {
    finding(UNDO_HOOK, 'a countdown is not a poll: the window is one timeout, not an interval');
  }
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /window\.addEventListener\('pagehide', onPageHide\)/,
    'leaving the page must carry out what is pending rather than abandon it',
  );
  expectAtLeast(
    UNDO_HOOK,
    undoHook,
    /failureRef\.current\?\.\(id\)/g,
    2,
    'a thrown error and a rejected promise must both hand the id back, because the caller has to put its projection back',
  );
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /duration: UNDO_WINDOW_MS,/,
    'the toast must live exactly as long as the undo is possible',
  );
  expectMatch(
    UNDO_HOOK,
    undoHook,
    /onAction: \(\) => \{\s*undo\.undoNow\(id\);/,
    'the toast action must take the change back through the window, not through a second path',
  );
}

// ---------------------------------------------------------------------------
// 4. Autosave: a draft is not a record, and some fields are never drafted
// ---------------------------------------------------------------------------

if (draftPure !== null) {
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /export const AUTOSAVE_DELAY_MS = \d+;/,
    'the quiet period must be a named constant, not a number inside the hook',
  );
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /export const MAX_DRAFT_BYTES = \d+;/,
    'a draft must be bounded, or a large form fails a write mid keystroke',
  );
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /byteLength\(serialized\) > MAX_DRAFT_BYTES/,
    'the size cap must be measured against the serialized bytes, or the limit is a number nothing applies',
  );
  const denied = /export const DRAFT_DENIED_KEYS: readonly string\[\] = \[([\s\S]*?)\];/.exec(
    draftPure,
  );
  if (denied === null) {
    finding(DRAFT_PURE, 'the denied key list must be declared in the engine');
  } else {
    for (const key of REQUIRED_DENIED_KEYS) {
      if (!denied[1].includes(`'${key}'`)) {
        finding(
          DRAFT_PURE,
          `a draft must never store "${key}": the denied list is the floor under the caller's schema`,
        );
      }
    }
  }
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /export function findDeniedKey\(value: unknown, depth = 0, path = ''\)/,
    'the denied scan must walk the payload, not only its top level',
  );
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /if \(findDeniedKey\(envelope\.payload\) !== null\) \{\s*return null;/,
    'serializing must refuse a denied payload, so the rule holds even for a caller that skips the hook',
  );
  expectMatch(
    DRAFT_PURE,
    draftPure,
    /return next\.updatedAtMs >= stored\.updatedAtMs;/,
    'a backgrounded tab must not overwrite a newer draft',
  );
}

if (autosaveHook !== null) {
  if (/\b1200\b/.test(hookCodeOf(AUTOSAVE_HOOK) ?? '')) {
    finding(
      AUTOSAVE_HOOK,
      'the quiet period belongs to the engine: a second copy is a second answer to when work is kept',
      autosaveHook,
      autosaveHook.search(/\b1200\b/),
    );
  }
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /serializeDraft\(envelope\)/,
    'a draft must be written through the engine, which applies the cap and the denied list',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /parseDraft\(readStored\(storageKey\)\.value\)/,
    'stored bytes must be read through the engine parser',
  );
  if (/JSON\.parse\(/.test(hookCodeOf(AUTOSAVE_HOOK) ?? '')) {
    finding(
      AUTOSAVE_HOOK,
      'the hook must not parse storage itself: the envelope check belongs in the engine',
    );
  }
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /schemaRef\.current\.safeParse\(stored\.payload\)/,
    "a draft is offered only after the caller's schema has accepted it",
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /shouldAdoptDraft\(stored, recordUpdatedAtMs\)/,
    'a draft older than the record must not be offered, or the reader is invited to reintroduce saved work',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /shouldWriteDraft\(stored, envelope\)/,
    'the stale write guard must be applied before every write',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /saveRef\.current = save;/,
    'the save callback must be held in a ref, or an inline prop restarts the debounce forever',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /schemaRef\.current = schema;/,
    'the schema must be held in a ref for the same reason as the save callback',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /useRetry\(\{/,
    'a failed write must be retried under the bounded policy, not in a loop of its own',
  );
  expectMatch(AUTOSAVE_HOOK, autosaveHook, /maxAttempts: 3,/, 'the retry policy must stay bounded');
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /window\.clearTimeout\(timer\)/,
    'the debounce timer must be cleared on unmount',
  );
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /installLogoutClearSignal\(/,
    'signing out must drop the recovered draft from this tab',
  );
  const statuses = unionMembers(autosaveHook, 'AutosaveStatus');
  const labels = caseLabels(autosaveHook);
  for (const status of statuses) {
    if (!labels.has(status)) {
      finding(
        AUTOSAVE_HOOK,
        `the status "${status}" has no case in the message switch, so the indicator would show nothing`,
      );
    }
  }
  expectMatch(
    AUTOSAVE_HOOK,
    autosaveHook,
    /findDeniedKey\(payload\) === null \? 'size' : 'denied'/,
    'a blocked draft must say which of the two refusals it was, because the reader can act on one of them',
  );
}

// ---------------------------------------------------------------------------
// 5. Optimistic updates: show now, keep the truth straight later
// ---------------------------------------------------------------------------

if (optimisticPure !== null) {
  expectMatch(
    OPTIMISTIC_PURE,
    optimisticPure,
    /export function project<T>\(queue: OptimisticQueue<T>\): T \{\s*return queue\.mutations\.reduce<T>/,
    'the projection must be a fold over the pending changes',
  );
  expectMatch(
    OPTIMISTIC_PURE,
    optimisticPure,
    /export function settle<T>\(queue: OptimisticQueue<T>, id: string\): OptimisticQueue<T> \{/,
    'settling one change must fold only up to it and keep the later ones pending',
  );
  const rollbackBody = bodyOf(optimisticPure, 'export function rollback<T>(');
  if (rollbackBody === null) {
    finding(OPTIMISTIC_PURE, 'the rollback function must exist');
  } else {
    if (/baseline/.test(rollbackBody)) {
      finding(
        OPTIMISTIC_PURE,
        'rollback must not touch the baseline: a failure removes one change, and the later ones are re-applied to the confirmed value',
      );
    }
    if (!/queue\.mutations\.filter\(/.test(rollbackBody)) {
      finding(OPTIMISTIC_PURE, 'rollback must drop exactly the one mutation and keep the rest');
    }
  }
  expectMatch(
    OPTIMISTIC_PURE,
    optimisticPure,
    /const foldCount = next\.length - MAX_PENDING_MUTATIONS;/,
    'a full queue must fold its oldest change rather than drop it: the reader still sees their edit',
  );
}

if (optimisticHook !== null) {
  for (const engineCall of [
    'createQueue(',
    'enqueue(',
    'project(',
    'settleQueue(',
    'rollbackQueue(',
  ]) {
    if (!optimisticHook.includes(engineCall)) {
      finding(
        OPTIMISTIC_HOOK,
        `the hook must use the engine's ${engineCall}, or the queue has two implementations`,
      );
    }
  }
  const applyBody = bodyOf(optimisticHook, 'const apply = useCallback(');
  if (applyBody === null) {
    finding(OPTIMISTIC_HOOK, 'apply must exist');
  } else if (/requestRef\.current\(/.test(applyBody)) {
    finding(
      OPTIMISTIC_HOOK,
      'apply must not send the request: showing a change and making it real are separate calls, or the undo window has nothing to hold',
    );
  }
  expectMatch(
    OPTIMISTIC_HOOK,
    optimisticHook,
    /if \(inFlightRef\.current !== null\) \{\s*return;/,
    'one request at a time, so two answers cannot arrive out of order',
  );
  expectMatch(
    OPTIMISTIC_HOOK,
    optimisticHook,
    /if \(inFlightRef\.current === id\) \{/,
    'a change that has been sent cannot be rolled back locally, and the guard must say so',
  );
  expectMatch(
    OPTIMISTIC_HOOK,
    optimisticHook,
    /const upto = indexOf\(queueRef\.current, id\) \+ 1;/,
    'a request carries everything up to and including the change it commits, never the changes made after it',
  );
  expectMatch(
    OPTIMISTIC_HOOK,
    optimisticHook,
    /publish\(settleQueue\(queueRef\.current, id\)\);/,
    'a success must settle through the change it carried',
  );
  expectMatch(
    OPTIMISTIC_HOOK,
    optimisticHook,
    /publish\(rollbackQueue\(queueRef\.current, id\)\);/,
    'a failure must take back that change and no other',
  );
}

// ---------------------------------------------------------------------------
// 6. Explainability: a closed reason list beside its sentences
// ---------------------------------------------------------------------------

if (
  explainabilityCopy !== null &&
  explainabilityPure !== null &&
  explainabilityComponent !== null
) {
  const reasonBlock = /export const explainabilityReasons = \[([\s\S]*?)\] as const;/.exec(
    explainabilityCopy,
  );
  if (reasonBlock === null) {
    finding(
      EXPLAINABILITY_COPY,
      'the reason list must live beside the copy, because a reason and its words are one fact',
    );
  } else {
    const reasons = [...reasonBlock[1].matchAll(/'([a-z_]+)'/g)].map((entry) => entry[1]);
    const keys = catalogueKeys(explainabilityCopy);
    for (const reason of reasons) {
      for (const part of EXPLAINABILITY_PARTS) {
        if (!keys.has(`${part}_${reason}`)) {
          finding(
            EXPLAINABILITY_COPY,
            `"${reason}" has no ${part} sentence, so the panel would render a gap where a sentence belongs`,
          );
        }
      }
    }
    for (const key of keys) {
      const part = EXPLAINABILITY_PARTS.find((candidate) => key.startsWith(`${candidate}_`));
      if (part === undefined) {
        continue;
      }
      const reason = key.slice(part.length + 1);
      if (!reasons.includes(reason)) {
        finding(
          EXPLAINABILITY_COPY,
          `"${key}" belongs to no reason in the list, so no payload can ever reach it`,
        );
      }
    }
    expectMatch(
      EXPLAINABILITY_PURE,
      explainabilityPure,
      /return isExplainabilityReason\(value\) \? value : FALLBACK_EXPLAINABILITY_REASON;/,
      'an unknown reason must resolve to the fallback rather than to an empty panel',
    );
    expectIncludes(
      EXPLAINABILITY_PURE,
      explainabilityPure,
      'export type ExplainabilityReason = (typeof explainabilityReasons)[number];',
      'the reason union must be derived from the list, so a new reason cannot compile without its copy',
    );
  }

  expectMatch(
    EXPLAINABILITY_PURE,
    explainabilityPure,
    /const cleaned = value\.replace\(CONTROL_CHARACTER_PATTERN, ''\)\.trim\(\);/,
    'a reference from a payload must be stripped of control characters before it is displayed',
  );
  expectMatch(
    EXPLAINABILITY_PURE,
    explainabilityPure,
    /return cleaned\.length === 0 \? null : cleaned\.slice\(0, MAX_REFERENCE_LENGTH\);/,
    'a reference must be capped, so a payload cannot stretch the panel',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /if \(value === undefined \|\| !isSafeUrl\(value\)\) \{\s*return null;/,
    'a support link must pass the same URL rule the sanitizer applies to rich text, shared rather than copied',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /if \(trimmed\.startsWith\('\/'\) && !trimmed\.startsWith\('\/\/'\)\) \{/,
    'a protocol-relative address leaves this origin as surely as an absolute one, so it must be refused',
  );
  expectMatch(
    EXPLAINABILITY_PURE,
    explainabilityPure,
    /const hours = String\(at\.getUTCHours\(\)\)\.padStart\(2, '0'\);/,
    'the instant must be formatted from its UTC parts, so the server and the browser agree on the label',
  );

  if (/toLocaleString|Intl\.DateTimeFormat/.test(explainabilityComponent)) {
    finding(
      EXPLAINABILITY_COMPONENT,
      'a locale formatted instant renders differently on the server and in the browser, which is a hydration mismatch, not a detail',
      explainabilityComponent,
      explainabilityComponent.search(/toLocaleString|Intl\.DateTimeFormat/),
    );
  }
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /const resolved = resolveExplainabilityReason\(reason\);/,
    'the component must resolve the reason against the closed list rather than render what it was handed',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /sanitizeReference,/,
    'the component must validate the reference before it renders it',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /data-explainability=\{resolved\}/,
    'the panel must name its resolved reason in the markup, so the rendered side can be measured',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /className="wrap-anywhere rounded-sm bg-muted px-1\.5 py-0\.5 font-mono text-xs"/,
    'a reference is an unbroken token, so it must carry the wrap guard that keeps 320 pixels from scrolling sideways',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /<time dateTime=\{expectedBy\}>/,
    'the machine readable instant and the printed label must be the same element',
  );
  expectMatch(
    EXPLAINABILITY_COMPONENT,
    explainabilityComponent,
    /t\(explainabilityKey\(resolved, 'expected'\)\)/,
    'every sentence must come from the catalogue through the typed key builder',
  );
}

// ---------------------------------------------------------------------------
// 7. Copy, the gallery and the mounted toast surface
// ---------------------------------------------------------------------------

if (usabilityCopy !== null) {
  const keys = catalogueKeys(usabilityCopy);
  const required = [
    'saved_views_title',
    'saved_views_unavailable',
    'saved_views_limit_reached',
    'undo_title',
    'undo_action',
    'undo_failed',
    'autosave_status_pending',
    'autosave_status_saved',
    'autosave_status_recovered',
    'autosave_denied_note',
    'optimistic_title',
    'optimistic_rolled_back',
    'optimistic_queue_note',
  ];
  for (const key of required) {
    if (!keys.has(key)) {
      finding(USABILITY_COPY, `the ${key} sentence is missing from the usability copy`);
    }
  }
  if (keys.size < 40) {
    finding(
      USABILITY_COPY,
      `the namespace holds ${String(keys.size)} keys, which is fewer than the four primitives need`,
    );
  }
}

const PROBE = 'docs/EVIDENCE/step-01/usability-probe.mjs';
const probe = requireFile(
  PROBE,
  'the evidence probe that executes these decisions must exist and stay runnable',
);
if (probe !== null) {
  // Every relative import in the probe has to resolve to a file that exists.
  // The probe runs the real modules in Node, so a moved engine would be a probe
  // that reports its own stale copy as evidence.
  const directory = PROBE.slice(0, PROBE.lastIndexOf('/'));
  for (const match of probe.matchAll(/from '(\.\.?\/[^']+)'/g)) {
    const resolved = new URL(match[1], `file:///${directory}/`).pathname.replace(/^\//, '');
    if (readTextFile(resolved) === null) {
      finding(PROBE, `the probe imports ${match[1]}, which resolves to no tracked file`);
    }
  }
  expectIncludes(
    PROBE,
    probe,
    'RESULT:',
    'the probe must report a result line, or its output cannot be evidence',
  );
}

if (gallery !== null) {
  for (const marker of GALLERY_MARKERS) {
    if (!gallery.includes(marker)) {
      finding(GALLERY, `the specimen must carry ${marker}, or the rendered check cannot see it`);
    }
  }
  for (const hookCall of [
    { name: 'useSavedViews', pattern: /useSavedViews\(/ },
    { name: 'useUndoToast', pattern: /useUndoToast\(/ },
    { name: 'useAutosave', pattern: /useAutosave\(/ },
    { name: 'useOptimisticRecord', pattern: /useOptimisticRecord[<(]/ },
  ]) {
    if (!hookCall.pattern.test(gallery)) {
      finding(
        GALLERY,
        `the specimen must run ${hookCall.name} for real: a gallery that describes a primitive is not evidence`,
      );
    }
  }
  expectIncludes(
    GALLERY,
    gallery,
    '<ExplainabilityMessage',
    'the specimen must render the explainability panel',
  );
  expectMatch(
    GALLERY,
    gallery,
    /reason="provider_code_9f3"/,
    'the specimen must render a reason this build does not know, because the fallback is the case that matters',
  );
}

if (galleryPage !== null) {
  expectIncludes(
    GALLERY_PAGE,
    galleryPage,
    '<ShowcaseUsability />',
    'the usability showcase must be mounted in the gallery',
  );
}

if (rootLayout !== null) {
  expectMatch(
    ROOT_LAYOUT,
    rootLayout,
    /<ToastProvider>/,
    'the undo toast needs one toast surface above every page, so the provider is mounted in the root layout',
  );
}

if (toastHook !== null) {
  expectMatch(
    TOAST_HOOK,
    toastHook,
    /export interface ToastActionRequest \{/,
    'a toast must be able to carry one action: the undo window is a toast with an action on it',
  );
  expectMatch(
    TOAST_HOOK,
    toastHook,
    /<ToastAction asChild altText=\{queued\.action\.label\}>/,
    'the action must be a real toast action, announced with its label',
  );
  expectMatch(
    TOAST_HOOK,
    toastHook,
    /export function useToast\(\): ToastActions \{/,
    'the surface must publish its entry points, or a page cannot raise a toast',
  );
  expectMatch(
    TOAST_HOOK,
    toastHook,
    /data-toast-stack="global"/,
    'the single surface must be findable in the rendered page',
  );
}

// ---------------------------------------------------------------------------
// 8. One owner per storage namespace, and no second clock or timer
// ---------------------------------------------------------------------------

const files = listTrackedFiles();
/**
 * One owner per storage namespace. This file is excluded because it is where
 * the rule is written down: the namespace strings below are the rule, not a
 * second implementation of the key.
 */
const NAMESPACE_OWNERS = [
  { namespace: 'kd.saved-views', owner: SAVED_VIEWS_PURE },
  { namespace: 'kd.draft', owner: DRAFT_PURE },
];
const RULE_FILE = 'scripts/checks/usability.mjs';
let scannedFiles = 0;

for (const file of files) {
  if (!/\.(ts|tsx|mjs)$/.test(file)) {
    continue;
  }
  const source = readTextFile(file);
  if (source === null) {
    continue;
  }
  scannedFiles += 1;
  for (const entry of NAMESPACE_OWNERS) {
    if (file === RULE_FILE || !source.includes(entry.namespace)) {
      continue;
    }
    if (file !== entry.owner) {
      finding(
        file,
        `the "${entry.namespace}" storage namespace has one owner, ${entry.owner}; a second copy is how a key stops matching the one that cleared it`,
        source,
        source.indexOf(entry.namespace),
      );
    }
  }
  if (file === GALLERY || file === GALLERY_PAGE) {
    if (/setInterval\(/.test(source)) {
      finding(file, 'the gallery must not poll: every specimen is driven by an event');
    }
  }
}

reportResult(
  CHECK,
  findings,
  `4 usability primitives verified (saved views with a declared key allowlist, the 5000 ms undo floor committed exactly once, a bounded autosave draft with a denied key floor, and an optimistic queue that re-applies what a failure must not take back), explainability reasons and their ${String(EXPLAINABILITY_PARTS.length)} sentences checked in both directions, ${String(scannedFiles)} source files scanned for a second owner of a storage key`,
);
process.exitCode = findings.length === 0 ? 0 : 1;
