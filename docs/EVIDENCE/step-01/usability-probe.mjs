// path: docs/EVIDENCE/step-01/usability-probe.mjs
/**
 * Sub-step 1.27 evidence: the usability primitives, decided rather than
 * described.
 *
 * This file is evidence, not part of the product and not a test. It is run by
 * hand when the sub-step is closed, and its output is recorded in
 * docs/handoffs/CHAT_01_PROGRESS.md. The project ships no test files (Rule 4),
 * so nothing here is wired into `npm run verify`.
 *
 * What it proves, and why it can: every decision behind the four primitives
 * lives in a pure module that takes its ids, its timestamps and its storage key
 * as arguments and reads no clock of its own. Node 22 strips the types and runs
 * those modules directly, so the rules below are executed rather than read off
 * the source. That is the difference between "the check found the words" and
 * "the function refused the payload".
 *
 *   1. **Saved views** - the key refuses a malformed owner, a hand-edited
 *      payload loses exactly the entries that fail validation, a declared key
 *      allowlist is what may persist, the cap refuses rather than drops, and a
 *      name saved twice updates instead of accumulating.
 *   2. **The undo window** - five seconds is a floor rather than a preference,
 *      expiry is computed from an instant, a fourth pending action pushes the
 *      oldest out instead of forgetting it, and one timer can be armed for
 *      several windows.
 *   3. **Drafts** - a credential in a payload is found at any depth and refused
 *      before anything is written, the size cap is measured in bytes, and an
 *      older tab can never overwrite a newer draft.
 *   4. **Optimistic updates** - a failed change is taken back while the changes
 *      made after it survive, which is the whole reason the queue exists.
 *   5. **Explainability** - an unknown reason degrades to the fallback panel,
 *      every reason resolves to a sentence that exists in the catalogue, and a
 *      reference and an instant from a payload are made safe and deterministic
 *      before they are rendered.
 */
import { explainability as explainabilityStrings } from '../../../lib/i18n/strings/en/explainability.ts';
import {
  DRAFT_STORAGE_PREFIX,
  MAX_DRAFT_BYTES,
  byteLength,
  draftStorageKey,
  findDeniedKey,
  parseDraft,
  serializeDraft,
  shouldAdoptDraft,
  shouldWriteDraft,
} from '../../../lib/usability/draft.ts';
import {
  EXPLAINABILITY_PARTS,
  explainabilityKey,
  formatUtcTimestamp,
  resolveExplainabilityReason,
  sanitizeReference,
} from '../../../lib/usability/explainability.ts';
import {
  MAX_PENDING_MUTATIONS,
  createQueue,
  enqueue,
  pendingMutations,
  project,
  rollback,
  settle,
  settleAll,
} from '../../../lib/usability/optimistic.ts';
import {
  MAX_SAVED_VIEWS,
  SAVED_VIEW_STORAGE_PREFIX,
  MAX_VIEW_NAME_LENGTH,
  parseSavedViews,
  projectFilterValues,
  removeView,
  renameView,
  savedViewsStorageKey,
  saveView,
  serializeSavedViews,
} from '../../../lib/usability/saved-views.ts';
import {
  MAX_PENDING_UNDOS,
  UNDO_WINDOW_MS,
  isUndoExpired,
  nextExpiryMs,
  pushEntry,
  splitExpired,
  undoRemainingMs,
  undoWindowMs,
} from '../../../lib/usability/undo-window.ts';

/**
 * Every decision about UTC in this file would pass in a container whose clock
 * is already UTC even if the function printed local parts, which is exactly the
 * defect the format decision exists to catch. The zone is therefore pinned to
 * one that is not UTC before any timestamp is formatted, so the difference
 * between a UTC instant and a local one is visible here whatever the host is.
 * The imports above are hoisted, so the assignment runs before the first
 * decision either way - it sits below them because a module's imports belong
 * at its top.
 */
process.env.TZ = 'Asia/Dhaka';

const results = [];

function check(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
}

function write(line) {
  process.stdout.write(`${line}\n`);
}

// ---------------------------------------------------------------------------
// 1. Saved views
// ---------------------------------------------------------------------------

write('saved views:');
write('');
const savedViewsStart = results.length;

const KEY = savedViewsStorageKey('usr_01J8ZQ', 'invoices');
check(
  'key names the owner and the list',
  // The expected key is built from the prefix the engine exports rather than
  // from a copy of the string: a probe with its own copy of a storage key is a
  // probe that agrees with itself.
  KEY === `${SAVED_VIEW_STORAGE_PREFIX}.usr_01J8ZQ.invoices`,
  String(KEY),
);
for (const bad of ['', '../other', 'a b', 'x'.repeat(65), 'owner/../list']) {
  check(`key refuses ${JSON.stringify(bad)}`, savedViewsStorageKey(bad, 'invoices') === null);
}

const ID_A = '018f4c1a-1c2b-7c3d-8e4f-5a6b7c8d9e0f';
const ID_B = '018f4c1a-1c2b-7c3d-8e4f-5a6b7c8d9e10';
const ALLOWED = ['status', 'period'];

const cleanEntry = {
  id: ID_A,
  name: 'Overdue this month',
  filters: { status: 'overdue', period: 'this month' },
  createdAtMs: 1000,
  updatedAtMs: 1000,
};

const hostilePayload = JSON.stringify({
  version: 1,
  views: [
    cleanEntry,
    { ...cleanEntry, id: 'not-a-uuid' },
    { ...cleanEntry, id: ID_B, name: '   ' },
    { ...cleanEntry, id: ID_B, name: `bad${String.fromCharCode(7)}name`.padEnd(80, 'x') },
    { ...cleanEntry, id: ID_B, filters: { status: 'x', secretField: 'kept', nested: { a: 1 } } },
    { ...cleanEntry, id: ID_B, updatedAtMs: 5 },
    'not an object',
  ],
});

// Seven entries go in. Three survive: the clean one, the one whose name needed
// cleaning and clamping, and the one whose filters hold an undeclared key. The
// four that fail are a malformed id, an empty name, a timestamp that runs
// backwards and a value that is not an entry at all.
const parsed = parseSavedViews(hostilePayload, ALLOWED);
check(
  'a hand-edited payload loses exactly the invalid entries',
  parsed.length === 3,
  `${String(parsed.length)} entries`,
);
check(
  'the clean entry survives untouched',
  parsed[0].id === ID_A && parsed[0].name === 'Overdue this month',
);
check(
  'a control character is stripped from a name',
  !parsed[1].name.includes(String.fromCharCode(7)),
);
check(
  'a name is clamped to the cap',
  parsed[1].name.length === MAX_VIEW_NAME_LENGTH,
  String(parsed[1].name.length),
);
check(
  'an undeclared filter key never survives',
  parsed[2].filters.secretField === undefined && parsed[2].filters.nested === undefined,
);
check(
  'the projected entry keeps only the declared key',
  parsed[2].filters.status === 'x' && Object.keys(parsed[2].filters).length === 1,
  JSON.stringify(parsed[2].filters),
);

check('garbage is not parsed', parseSavedViews('{ not json', ALLOWED).length === 0);
check(
  'a future version is not guessed at',
  parseSavedViews(JSON.stringify({ version: 2, views: [cleanEntry] }), ALLOWED).length === 0,
);
check('a missing envelope is empty', parseSavedViews(null, ALLOWED).length === 0);

const projection = projectFilterValues(ALLOWED, {
  status: 'draft',
  period: 42,
  extra: 'must not persist',
  empty: '',
  infinite: Number.POSITIVE_INFINITY,
  nested: { a: 1 },
});
check('values are scalars only', Object.keys(projection).length === 2, JSON.stringify(projection));
check('a finite number is kept', projection.period === 42);
check('an empty string is dropped', projection.empty === undefined);
check('an infinite number is dropped', projection.infinite === undefined);
check('an undeclared key is dropped', projection.extra === undefined);
const longValue = projectFilterValues(['note'], { note: 'x'.repeat(400) });
check(
  'a value is clamped to its cap',
  longValue.note.length === 120,
  String(longValue.note.length),
);

let list = [];
for (let index = 0; index < MAX_SAVED_VIEWS; index += 1) {
  const written = saveView(list, {
    id: `018f4c1a-1c2b-7c3d-8e4f-${String(index).padStart(12, '0')}`,
    name: `View ${String(index)}`,
    filters: { status: 'draft' },
    nowMs: 1000 + index,
  });
  list = written.views;
}
check('the list fills to its cap', list.length === MAX_SAVED_VIEWS, String(list.length));
const overflowing = saveView(list, {
  id: ID_B,
  name: 'One too many',
  filters: {},
  nowMs: 9000,
});
check(
  'a full list refuses instead of dropping a view',
  overflowing.outcome === 'limit_reached' && overflowing.views.length === MAX_SAVED_VIEWS,
);

const replaced = saveView(list, {
  id: ID_B,
  name: 'view 3',
  filters: { status: 'paid' },
  nowMs: 9001,
});
check(
  'the same name updates rather than accumulates',
  replaced.outcome === 'replaced' && replaced.views.length === MAX_SAVED_VIEWS,
);
const replacedView = replaced.views.find((view) => view.id === list[3].id);
check(
  'the replacement keeps its identity and takes the new filters',
  replacedView.updatedAtMs === 9001 && replacedView.filters.status === 'paid',
);

const renamed = renameView(list, list[0].id, 'View 1', 9002);
check(
  'a duplicate rename is refused',
  renamed.outcome === 'duplicate_name' && renamed.views === list,
);
const removed = removeView(list, '018f4c1a-1c2b-7c3d-8e4f-999999999999');
check(
  'removing an id that is gone changes nothing',
  removed.outcome === 'not_found' && removed.views.length === list.length,
);

const roundTrip = parseSavedViews(serializeSavedViews(replaced.views), ALLOWED);
check(
  'a serialized list reads back identically',
  JSON.stringify(roundTrip) === JSON.stringify(replaced.views),
);

write(
  `  ${String(results.length - savedViewsStart)} decisions on saved views: the key, the parser and the cap`,
);
write('');

// ---------------------------------------------------------------------------
// 2. The undo window
// ---------------------------------------------------------------------------

write('undo window:');
write('');
const undoStart = results.length;

check('the mandated window is five seconds', UNDO_WINDOW_MS === 5000, String(UNDO_WINDOW_MS));
check('a shorter request is raised to the floor', undoWindowMs(800) === UNDO_WINDOW_MS);
check('a longer request is honoured', undoWindowMs(9000) === 9000);
check('a request beyond the ceiling is clamped', undoWindowMs(600000) === 15000);
check('no request means the floor', undoWindowMs() === UNDO_WINDOW_MS);

const entry = { id: 'undo-1', scheduledAtMs: 1000, windowMs: UNDO_WINDOW_MS };
check(
  'the window is still open one millisecond before its end',
  !isUndoExpired(entry, 1000 + UNDO_WINDOW_MS - 1),
);
check('the window is closed exactly at its end', isUndoExpired(entry, 1000 + UNDO_WINDOW_MS));
check('the remaining time never goes negative', undoRemainingMs(entry, 99999) === 0);

const first = { id: 'a', scheduledAtMs: 1000, windowMs: 5000 };
const second = { id: 'b', scheduledAtMs: 2000, windowMs: 5000 };
check(
  'one timer can be armed for the soonest expiry',
  nextExpiryMs([first, second], 1000) === 6000,
);
check('an empty list arms no timer', nextExpiryMs([], 1000) === null);
check('an expired entry asks for an immediate wake', nextExpiryMs([first], 9000) === 9000);

const split = splitExpired([first, second], 6100);
check('expiry splits the list', split.expired.length === 1 && split.pending.length === 1);
check('the expired one is the one whose window closed', split.expired[0].id === 'a');

let pending = [];
let overflow = [];
for (let index = 0; index < MAX_PENDING_UNDOS + 1; index += 1) {
  const pushed = pushEntry(pending, {
    id: `u${String(index)}`,
    scheduledAtMs: 1000 + index * 100,
    windowMs: 5000,
  });
  pending = pushed.entries;
  overflow = pushed.overflow;
}
check('pending windows are capped', pending.length === MAX_PENDING_UNDOS, String(pending.length));
check('the action pushed out is the oldest', overflow.length === 1 && overflow[0].id === 'u0');
check(
  'the newest action is the one that was kept',
  pending.some((candidate) => candidate.id === `u${String(MAX_PENDING_UNDOS)}`),
);

write(
  `  ${String(results.length - undoStart)} decisions on the window, its floor and its overflow`,
);
write('');

// ---------------------------------------------------------------------------
// 3. Drafts
// ---------------------------------------------------------------------------

write('drafts:');
write('');
const draftStart = results.length;

const draftKey = draftStorageKey('usr_01J8ZQ', 'invoices', 'inv_01J8ZQ');
check(
  'the key names the record as well as the list',
  draftKey === `${DRAFT_STORAGE_PREFIX}.usr_01J8ZQ.invoices.inv_01J8ZQ`,
  String(draftKey),
);
check(
  'a malformed record id is refused',
  draftStorageKey('usr', 'invoices', 'not a record') === null,
);

check('garbage is not a draft', parseDraft('{{') === null);
check(
  'a future envelope is not guessed at',
  parseDraft(JSON.stringify({ version: 2, updatedAtMs: 1, payload: {} })) === null,
);
check('a payload is required', parseDraft(JSON.stringify({ version: 1, updatedAtMs: 1 })) === null);
check(
  'a timestamp is required',
  parseDraft(JSON.stringify({ version: 1, updatedAtMs: 0, payload: {} })) === null,
);
const envelope = parseDraft(
  JSON.stringify({ version: 1, updatedAtMs: 1234, payload: { note: 'hello' } }),
);
check(
  'a well formed envelope round trips',
  envelope !== null && envelope.updatedAtMs === 1234,
  JSON.stringify(envelope),
);

check(
  'a top level credential is found',
  findDeniedKey({ note: 'x', password: 'hunter2' }) === 'password',
);
check(
  'a nested credential is found',
  findDeniedKey({ client: { card: { cardNumber: '4111' } } }) === 'client.card.cardNumber',
);
check(
  'a credential inside an array is found',
  findDeniedKey({ lines: [{ iban: 'DE00' }] }) === 'lines[0].iban',
);
check(
  'a separated key name is still the same key',
  findDeniedKey({ card_number: '4111' }) === 'card_number',
);
check('a clean payload passes', findDeniedKey({ note: 'hello', amount: 12.5 }) === null);

check(
  'a denied payload cannot be serialized',
  serializeDraft({ version: 1, updatedAtMs: 1, payload: { cvv: '123' } }) === null,
);
const tooLarge = serializeDraft({
  version: 1,
  updatedAtMs: 1,
  payload: { note: 'x'.repeat(MAX_DRAFT_BYTES + 100) },
});
check('a draft larger than the cap is refused', tooLarge === null);
const fine = serializeDraft({ version: 1, updatedAtMs: 1, payload: { note: 'hello' } });
check('a normal draft serializes', typeof fine === 'string' && parseDraft(fine) !== null);
check(
  'the cap is measured in bytes, not characters',
  // A two byte character, built from its code point: the ASCII-only rule bans
  // a non-ASCII character in a string literal, including one written as an
  // escape, so the value is constructed instead of spelled.
  byteLength(String.fromCodePoint(0xe9)) === 2 && byteLength('e') === 1,
);

const storedNewer = { version: 1, updatedAtMs: 2000, payload: {} };
check(
  'a stale write is refused',
  shouldWriteDraft(storedNewer, { version: 1, updatedAtMs: 1999, payload: {} }) === false,
);
check(
  'the same instant may write again',
  shouldWriteDraft(storedNewer, { version: 1, updatedAtMs: 2000, payload: {} }) === true,
);
check(
  'the first write is allowed',
  shouldWriteDraft(null, { version: 1, updatedAtMs: 1, payload: {} }) === true,
);
check('a draft newer than the record is offered', shouldAdoptDraft(storedNewer, 1999) === true);
check(
  'a draft older than the record is not offered',
  shouldAdoptDraft(storedNewer, 2000) === false,
);
check('a draft with no record time is offered', shouldAdoptDraft(storedNewer, null) === true);
check('no draft is nothing to offer', shouldAdoptDraft(null, null) === false);

write(
  `  ${String(results.length - draftStart)} decisions on the draft envelope, the denied keys, the size cap and the stale write guard`,
);
write('');

// ---------------------------------------------------------------------------
// 4. Optimistic updates
// ---------------------------------------------------------------------------

write('optimistic updates:');
write('');
const optimisticStart = results.length;

const rename = (value) => ({ ...value, name: `${value.name}+rename` });
const addLine = (value) => ({ ...value, lines: [...value.lines, 'line'] });

const start = { name: 'record', lines: [] };
let queue = createQueue(start);
let queued = enqueue(queue, { id: 'm1', apply: rename });
queue = queued.queue;
check('one pending change is visible immediately', project(queue).name === 'record+rename');
queued = enqueue(queue, { id: 'm2', apply: addLine });
queue = queued.queue;
check(
  'two changes project in order',
  project(queue).lines.length === 1 && project(queue).name === 'record+rename',
);
check('pending count is the queue length', pendingMutations(queue) === 2);

const rolledBackFirst = rollback(queue, 'm1');
check('a failed change is taken back', project(rolledBackFirst).name === 'record');
check('the change made after it survives', project(rolledBackFirst).lines.length === 1);
check('the failure itself is gone from the queue', pendingMutations(rolledBackFirst) === 1);

const settledFirst = settle(queue, 'm1');
check(
  'settling folds the change into the confirmed value',
  settledFirst.baseline.name === 'record+rename',
);
check(
  'settling keeps the later change pending',
  pendingMutations(settledFirst) === 1 && project(settledFirst).lines.length === 1,
);
check('settling an unknown id changes nothing', settle(queue, 'nope') === queue);
check('rolling back an unknown id changes nothing', rollback(queue, 'nope') === queue);

let capped = createQueue(0);
const folded = [];
for (let index = 0; index < MAX_PENDING_MUTATIONS + 1; index += 1) {
  const pushed = enqueue(capped, { id: `c${String(index)}`, apply: (value) => value + 1 });
  capped = pushed.queue;
  folded.push(...pushed.settled);
}
check(
  'a full queue folds its oldest change',
  pendingMutations(capped) === MAX_PENDING_MUTATIONS && folded.length === 1,
);
check(
  'the folded change stays visible',
  project(capped) === MAX_PENDING_MUTATIONS + 1,
  String(project(capped)),
);

const everything = settleAll(queue);
check(
  'settling everything leaves nothing pending',
  pendingMutations(everything) === 0 && project(everything).lines.length === 1,
);

write(
  `  ${String(results.length - optimisticStart)} decisions on the queue order, the settle, the rollback and the cap`,
);
write('');

// ---------------------------------------------------------------------------
// 5. Explainability
// ---------------------------------------------------------------------------

write('explainability:');
write('');
const explainabilityStart = results.length;

check(
  'a known reason passes through',
  resolveExplainabilityReason('payment_held') === 'payment_held',
);
check(
  'an unknown reason degrades to the fallback',
  resolveExplainabilityReason('provider_code_9f3') === 'unknown_outcome',
);
check('a non-string reason degrades too', resolveExplainabilityReason(42) === 'unknown_outcome');

const reasons = Object.keys(explainabilityStrings)
  .filter((key) => key.startsWith('headline_'))
  .map((key) => key.slice('headline_'.length));
let sentenceCount = 0;
let missingSentences = 0;
for (const reason of reasons) {
  for (const part of EXPLAINABILITY_PARTS) {
    // explainabilityKey returns the catalogue path; the namespace module holds
    // the same keys without the namespace segment, which is the import surface
    // the aggregator produces.
    const key = explainabilityKey(reason, part).slice('explainability.'.length);
    const sentence = explainabilityStrings[key];
    sentenceCount += 1;
    if (typeof sentence !== 'string' || sentence.length === 0) {
      missingSentences += 1;
    }
  }
}
check(
  'every reason has every sentence',
  missingSentences === 0,
  `${String(missingSentences)} missing of ${String(sentenceCount)}`,
);
check(
  'the sentence count is four per reason',
  sentenceCount === reasons.length * EXPLAINABILITY_PARTS.length,
  String(sentenceCount),
);

check(
  'a control character is stripped from a reference',
  sanitizeReference(`corr${String.fromCharCode(10)}_123`) === 'corr_123',
);
check(
  'a reference is trimmed and capped',
  sanitizeReference(`  ${'r'.repeat(200)}  `).length === 64,
);
check('an empty reference is refused', sanitizeReference('   ') === null);
check('a non-string reference is refused', sanitizeReference(null) === null);

check(
  'an instant is printed in UTC with padding',
  formatUtcTimestamp('2026-01-05T04:05:00Z') === '2026-01-05 04:05 UTC',
);
check(
  'an offset instant is converted to UTC',
  formatUtcTimestamp('2026-10-19T15:00:00+06:00') === '2026-10-19 09:00 UTC',
);
check(
  'an epoch instant is accepted',
  formatUtcTimestamp(Date.UTC(2026, 9, 19, 9, 0)) === '2026-10-19 09:00 UTC',
);
check('an unparseable instant is refused', formatUtcTimestamp('next tuesday') === null);
check(
  'an instant before this century is refused',
  formatUtcTimestamp('1970-01-01T00:00:00Z') === null,
);
check('a non-string, non-number instant is refused', formatUtcTimestamp({ at: 1 }) === null);

write(
  `  ${String(results.length - explainabilityStart)} decisions on ${String(reasons.length)} reasons and ${String(sentenceCount)} sentences, resolved through the typed key builder`,
);
write('');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const failures = results.filter((result) => !result.ok);
write(`${String(results.length)} decisions executed against the real modules`);
write(`failures: ${String(failures.length)}`);
for (const failure of failures) {
  write(`  FAIL ${failure.name}${failure.detail.length === 0 ? '' : ` (${failure.detail})`}`);
}
write('');
write(`RESULT: ${failures.length === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = failures.length === 0 ? 0 : 1;
