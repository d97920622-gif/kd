// path: lib/usability/draft.ts
/**
 * Drafts: the unsaved state of a form, recovered after a crash.
 *
 * FEATURE_LIST item 1848 asks for draft recovery after a crash (localStorage),
 * item 1855 for an autosave indicator, item 1849 for duplicate-tab awareness
 * and item 1850 for multi-tab session sync. Those four share one storage
 * decision, so the decision lives here and the hook in
 * lib/hooks/use-autosave.ts is only the timer and the status.
 *
 *   1. **A draft is not a record.** It is the reader's unfinished input, kept
 *      so a closed tab does not cost them their work. It is never rendered as
 *      truth: it is offered for recovery, and the reader decides.
 *   2. **A draft never overwrites a newer one.** Two tabs on the same record
 *      both autosave. The second write is allowed only when its timestamp is
 *      not older than what is already stored, so a tab that was backgrounded
 *      and wakes up late cannot silently roll the reader back to an earlier
 *      keystroke. That is the rule that makes the multi-tab item safe without a
 *      socket, and the socket in step 16 adds nothing to it.
 *   3. **Some fields may never be drafted.** A13.12 says no personal data in
 *      local storage. The primary gate is the caller's schema, which decides
 *      what a draft contains; this module adds a floor it can enforce itself -
 *      a deep scan for key names that name a credential or a card, refused
 *      before anything is written. A comment would not survive the first
 *      caller who adds a payment field to a form.
 *   4. **A stored draft is untrusted input.** It is read back through a
 *      versioned envelope with a validated timestamp, and the caller's schema
 *      then validates the payload. A draft this version cannot read is
 *      discarded, not guessed at.
 *   5. **Drafts are bounded in size.** A form that grows without limit would
 *      eventually fail a write in the middle of a keystroke; the cap turns that
 *      into a refusal the indicator can report.
 *
 * Pure on purpose: no React, no storage, no clock. The hook supplies the
 * timestamp and the storage calls.
 */

/** Storage namespace for drafts. */
export const DRAFT_STORAGE_PREFIX = 'kd.draft.v1';

/** Envelope version written with every draft. */
export const DRAFT_ENVELOPE_VERSION = 1;

/** Quiet period after the last edit before a draft is written, in milliseconds. */
export const AUTOSAVE_DELAY_MS = 1200;

/** Largest draft this module will write, in bytes. */
export const MAX_DRAFT_BYTES = 32768;

/** How deep the denied-key scan walks before it stops looking. */
export const MAX_DRAFT_DEPTH = 6;

/**
 * Key names that may never appear anywhere in a draft, lower-cased without
 * separators. This is a floor, not the whole rule: the caller's schema decides
 * what a draft contains, and this list exists so that the one mistake nobody
 * catches in review - a payment field added to an autosaved form - fails a
 * check instead of reaching a reader's disk.
 */
export const DRAFT_DENIED_KEYS: readonly string[] = [
  'password',
  'passcode',
  'secret',
  'token',
  'authorization',
  'apikey',
  'cardnumber',
  'cardholdername',
  'expiry',
  'cvv',
  'cvc',
  'pan',
  'iban',
  'accountnumber',
  'routingnumber',
  'ssn',
  'nationalid',
];

/** Owner, list and record identifiers that may appear in a storage key. */
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** A draft as stored: the envelope around whatever the caller's schema allows. */
export interface DraftEnvelope {
  readonly version: number;
  readonly updatedAtMs: number;
  readonly payload: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Normalize a key name for comparison against the denied list. */
function normalizeKeyName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Storage key for one record, or null when an identifier cannot be used in a
 * key. The record id is part of the key so two records open at once in two
 * tabs never share one draft slot.
 */
export function draftStorageKey(ownerId: string, listId: string, recordId: string): string | null {
  if (
    !IDENTIFIER_PATTERN.test(ownerId) ||
    !IDENTIFIER_PATTERN.test(listId) ||
    !IDENTIFIER_PATTERN.test(recordId)
  ) {
    return null;
  }
  return `${DRAFT_STORAGE_PREFIX}.${ownerId}.${listId}.${recordId}`;
}

/** The first denied key found in a value, as a dotted path, or null. */
export function findDeniedKey(value: unknown, depth = 0, path = ''): string | null {
  if (depth > MAX_DRAFT_DEPTH) {
    return null;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findDeniedKey(item, depth + 1, `${path}[${String(index)}]`);
      if (found !== null) {
        return found;
      }
    }
    return null;
  }
  if (!isRecord(value)) {
    return null;
  }
  for (const [key, item] of Object.entries(value)) {
    const here = path.length === 0 ? key : `${path}.${key}`;
    if (DRAFT_DENIED_KEYS.includes(normalizeKeyName(key))) {
      return here;
    }
    const found = findDeniedKey(item, depth + 1, here);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

/**
 * Read a stored draft. Returns null for anything that is not this version's
 * envelope, including a payload that was hand-edited to a plausible shape:
 * the caller's schema is the second gate, and a draft has to pass both.
 */
export function parseDraft(raw: string | null): DraftEnvelope | null {
  if (raw === null) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return null;
  }
  if (parsed.version !== DRAFT_ENVELOPE_VERSION) {
    return null;
  }
  const updatedAtMs = parsed.updatedAtMs;
  if (typeof updatedAtMs !== 'number' || !Number.isFinite(updatedAtMs) || updatedAtMs <= 0) {
    return null;
  }
  if (parsed.payload === undefined) {
    return null;
  }
  return { version: DRAFT_ENVELOPE_VERSION, updatedAtMs, payload: parsed.payload };
}

/** Serialize an envelope, or null when it may not be written at all. */
export function serializeDraft(envelope: DraftEnvelope): string | null {
  if (findDeniedKey(envelope.payload) !== null) {
    return null;
  }
  const serialized = JSON.stringify({
    version: DRAFT_ENVELOPE_VERSION,
    updatedAtMs: envelope.updatedAtMs,
    payload: envelope.payload,
  });
  return byteLength(serialized) > MAX_DRAFT_BYTES ? null : serialized;
}

/** UTF-8 byte length of a string, without a Buffer or a TextEncoder. */
export function byteLength(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return bytes;
}

/**
 * Whether a stored draft should be offered for recovery.
 *
 * A draft is offered only when it is newer than the record the page loaded.
 * A draft older than the record is a leftover from before the last save, and
 * offering it would invite the reader to reintroduce work that is already
 * superseded.
 */
export function shouldAdoptDraft(
  stored: DraftEnvelope | null,
  recordUpdatedAtMs: number | null,
): boolean {
  if (stored === null) {
    return false;
  }
  return recordUpdatedAtMs === null || stored.updatedAtMs > recordUpdatedAtMs;
}

/**
 * Whether this write may replace what is stored.
 *
 * The comparison is inclusive so the same tab can keep saving; it excludes
 * only a write that is strictly older than what is on disk, which is the
 * backgrounded-tab case.
 */
export function shouldWriteDraft(stored: DraftEnvelope | null, next: DraftEnvelope): boolean {
  if (stored === null) {
    return true;
  }
  return next.updatedAtMs >= stored.updatedAtMs;
}
