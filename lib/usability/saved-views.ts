// path: lib/usability/saved-views.ts
/**
 * Saved views: the filter state a reader chose, kept for their next visit.
 *
 * The plan asks for saved views per user and per list (FEATURE_LIST item 995,
 * A14.2). This module owns the part of that promise that has to be right even
 * when nothing about the caller is: what may be stored, what may be read back,
 * and what happens when the stored bytes are not what this code wrote.
 *
 * Five decisions, each one a failure mode:
 *
 *   1. **The stored bytes are untrusted input.** `localStorage` is editable by
 *      hand, by a browser extension and by another tab, so reading it is a
 *      parse of unknown data, not a load of our own record. Every entry is
 *      validated field by field against a shape and against the caller's
 *      allowlist; an entry that fails is dropped rather than repaired, because
 *      a repaired entry is a filter the reader never chose.
 *   2. **The caller declares which filter keys may persist.** A saved view
 *      persists an allowlist of named values, never "the filter object". That
 *      is the same rule the sanitizer follows, for the same reason: a caller
 *      that adds a free-text search box to a list must decide, in this file's
 *      terms, whether that text belongs on disk. Values are scalars only,
 *      because a nested object is a place for anything to hide (A13.12, no PII
 *      in local storage, starts here rather than at the PWA step).
 *   3. **The name is display text and an input.** It is stripped of control
 *      characters, collapsed and clamped before it is stored, and refused when
 *      nothing meaningful is left.
 *   4. **The list is bounded, and a full list is a refusal.** A cap of
 *      `MAX_SAVED_VIEWS` with an explicit `limit_reached` outcome gives the
 *      caller a sentence to show. Silently dropping the oldest view would
 *      delete a reader's work to make room for a new one.
 *   5. **The key names the owner and the list.** Two readers on one device, or
 *      one reader on two lists, must never share a view. The function that
 *      builds the key returns null for an identifier that does not match the
 *      safe pattern, so a malformed owner id cannot write into a neighbouring
 *      reader's namespace.
 *
 * Pure on purpose: no React, no storage, no clock, no randomness. Ids and
 * timestamps arrive as arguments, which is what lets the evidence probe run
 * every rule below in Node with no browser at all, and lets the hook stay a
 * thin adapter over functions that are decided here.
 */

/** Storage namespace. Bumping the version abandons old payloads instead of guessing. */
export const SAVED_VIEW_STORAGE_PREFIX = 'kd.saved-views.v1';

/** Payload version written into every envelope. */
export const SAVED_VIEW_VERSION = 1;

/** Views one reader may keep on one list, per the bounded-state rule. */
export const MAX_SAVED_VIEWS = 20;

/** Distinct filter keys a caller may declare for one list. */
export const MAX_FILTER_KEYS = 12;

/** Longest stored view name, in characters. */
export const MAX_VIEW_NAME_LENGTH = 40;

/** Longest stored filter value, in characters. */
export const MAX_FILTER_VALUE_LENGTH = 120;

/** Owner and list identifiers that may appear in a storage key. */
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Stored view identifiers, which are UUID version 7 values from lib/utils/id. */
const VIEW_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Characters a browser or a terminal would read as structure rather than text. */
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g;

/** Runs of whitespace, collapsed so a pasted name cannot carry layout. */
const WHITESPACE_RUN_PATTERN = /\s+/g;

/** One stored filter value: a scalar, never a structure. */
export type SavedViewValue = string | number | boolean | null;

/** The filters of a view, restricted to the keys the caller declared. */
export type SavedViewFilters = Readonly<Record<string, SavedViewValue>>;

/** A stored view. Times are epoch milliseconds, as written by the caller's clock. */
export interface SavedView {
  readonly id: string;
  readonly name: string;
  readonly filters: SavedViewFilters;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

/** What a write attempt did, so the caller can say so in a sentence. */
export type SavedViewOutcome =
  | 'added'
  | 'replaced'
  | 'renamed'
  | 'removed'
  | 'invalid_name'
  | 'duplicate_name'
  | 'limit_reached'
  | 'not_found';

/** The result of a write: the next state plus what happened to it. */
export interface SavedViewWrite {
  readonly views: readonly SavedView[];
  readonly outcome: SavedViewOutcome;
}

/** What a name is reduced to before it is stored, or null when nothing is left. */
export function sanitizeViewName(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const collapsed = raw
    .replace(CONTROL_CHARACTER_PATTERN, ' ')
    .replace(WHITESPACE_RUN_PATTERN, ' ');
  const trimmed = collapsed.trim();
  if (trimmed.length === 0) {
    return null;
  }
  return trimmed.slice(0, MAX_VIEW_NAME_LENGTH);
}

/**
 * Reduce one value to what may be stored, or undefined to leave the key out.
 * Numbers must be finite and strings must survive the control character strip;
 * a value that cannot be stored is dropped rather than coerced, because
 * `String(object)` is how a filter becomes "[object Object]" on disk.
 */
export function sanitizeFilterValue(value: unknown): SavedViewValue | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(CONTROL_CHARACTER_PATTERN, '').slice(0, MAX_FILTER_VALUE_LENGTH);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  return undefined;
}

/**
 * Project a filter object onto the declared keys.
 * Keys outside the allowlist never enter the result, which is what keeps a
 * later field added to a form from being persisted by accident.
 */
export function projectFilterValues(
  keys: readonly string[],
  values: Readonly<Record<string, unknown>>,
): SavedViewFilters {
  const filters: Record<string, SavedViewValue> = {};
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.size >= MAX_FILTER_KEYS) {
      break;
    }
    if (seen.has(key) || !IDENTIFIER_PATTERN.test(key)) {
      continue;
    }
    seen.add(key);
    const cleaned = sanitizeFilterValue(values[key]);
    if (cleaned !== undefined) {
      filters[key] = cleaned;
    }
  }
  return filters;
}

/**
 * Storage key for one reader and one list, or null when an identifier is not
 * safe to build a key from.
 */
export function savedViewsStorageKey(ownerId: string, listId: string): string | null {
  if (!IDENTIFIER_PATTERN.test(ownerId) || !IDENTIFIER_PATTERN.test(listId)) {
    return null;
  }
  return `${SAVED_VIEW_STORAGE_PREFIX}.${ownerId}.${listId}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readTimestamp(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** One candidate entry, or null when any field fails its check. */
function parseViewEntry(value: unknown, keys: readonly string[]): SavedView | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.id !== 'string' || !VIEW_ID_PATTERN.test(value.id)) {
    return null;
  }
  const name = sanitizeViewName(value.name);
  if (name === null) {
    return null;
  }
  if (!isRecord(value.filters)) {
    return null;
  }
  const createdAtMs = readTimestamp(value.createdAtMs);
  const updatedAtMs = readTimestamp(value.updatedAtMs);
  if (createdAtMs === null || updatedAtMs === null || updatedAtMs < createdAtMs) {
    return null;
  }
  return {
    id: value.id,
    name,
    filters: projectFilterValues(keys, value.filters),
    createdAtMs,
    updatedAtMs,
  };
}

/**
 * Parse a stored payload. Returns an empty list for anything that is not this
 * version's envelope, and drops individual entries that fail validation while
 * keeping the ones that pass, so one corrupt row does not cost a reader the
 * nineteen views that are still good.
 */
export function parseSavedViews(raw: string | null, keys: readonly string[]): readonly SavedView[] {
  if (raw === null) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!isRecord(parsed) || parsed.version !== SAVED_VIEW_VERSION) {
    return [];
  }
  const entries = parsed.views;
  if (!Array.isArray(entries)) {
    return [];
  }
  const views: SavedView[] = [];
  for (const entry of entries.slice(0, MAX_SAVED_VIEWS)) {
    const view = parseViewEntry(entry, keys);
    if (view !== null) {
      views.push(view);
    }
  }
  return views;
}

/** Serialize the payload that parseSavedViews accepts. */
export function serializeSavedViews(views: readonly SavedView[]): string {
  return JSON.stringify({ version: SAVED_VIEW_VERSION, views: views.slice(0, MAX_SAVED_VIEWS) });
}

/** The view with this id, or null. */
export function findView(views: readonly SavedView[], id: string): SavedView | null {
  return views.find((view) => view.id === id) ?? null;
}

/** True when two view names are the same name, ignoring case and padding. */
function sameName(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

/**
 * Save a view: replace the filters of a view with the same name, or append a
 * new one. Saving the same name twice is the natural way for a reader to
 * update "Overdue in Dhaka" instead of accumulating near-duplicates.
 */
export function saveView(
  views: readonly SavedView[],
  input: {
    readonly id: string;
    readonly name: unknown;
    readonly filters: SavedViewFilters;
    readonly nowMs: number;
  },
): SavedViewWrite {
  const name = sanitizeViewName(input.name);
  if (name === null) {
    return { views, outcome: 'invalid_name' };
  }
  if (!VIEW_ID_PATTERN.test(input.id) || !Number.isFinite(input.nowMs) || input.nowMs <= 0) {
    return { views, outcome: 'invalid_name' };
  }
  const existing = views.find((view) => sameName(view.name, name));
  if (existing !== undefined) {
    return {
      views: views.map((view) =>
        view.id === existing.id
          ? { ...view, name, filters: input.filters, updatedAtMs: input.nowMs }
          : view,
      ),
      outcome: 'replaced',
    };
  }
  if (views.length >= MAX_SAVED_VIEWS) {
    return { views, outcome: 'limit_reached' };
  }
  const created: SavedView = {
    id: input.id,
    name,
    filters: input.filters,
    createdAtMs: input.nowMs,
    updatedAtMs: input.nowMs,
  };
  return { views: [...views, created], outcome: 'added' };
}

/** Rename a view, refusing a name another view already holds. */
export function renameView(
  views: readonly SavedView[],
  id: string,
  rawName: unknown,
  nowMs: number,
): SavedViewWrite {
  const name = sanitizeViewName(rawName);
  if (name === null) {
    return { views, outcome: 'invalid_name' };
  }
  const target = views.find((view) => view.id === id);
  if (target === undefined) {
    return { views, outcome: 'not_found' };
  }
  if (views.some((view) => view.id !== id && sameName(view.name, name))) {
    return { views, outcome: 'duplicate_name' };
  }
  return {
    views: views.map((view) =>
      view.id === id ? { ...view, name, updatedAtMs: Math.max(nowMs, view.updatedAtMs) } : view,
    ),
    outcome: 'renamed',
  };
}

/** Remove a view. Removing an id that is already gone changes nothing. */
export function removeView(views: readonly SavedView[], id: string): SavedViewWrite {
  const next = views.filter((view) => view.id !== id);
  return { views: next, outcome: next.length === views.length ? 'not_found' : 'removed' };
}
