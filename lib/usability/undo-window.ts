// path: lib/usability/undo-window.ts
/**
 * The undo window: how long a destructive action may still be taken back.
 *
 * FEATURE_LIST item 156 and item 1852 ask for one thing precisely - five
 * seconds of undo on destructive actions, offered in a toast. The interesting
 * part is not the countdown, it is what the product must guarantee while the
 * countdown runs, so the window is modelled here rather than left inside a
 * hook:
 *
 *   - **Nothing is destroyed before the window closes.** The action is
 *     deferred, not compensated. A compensating write ("recreate what we just
 *     deleted") has to be able to rebuild a record that the audit rules of
 *     step 2 will make immutable, so the honest design is that the destructive
 *     request is sent when the window expires. Five seconds of divergence is
 *     the price and it is worth paying: a crash during the window means the
 *     action never happened, which is the safe direction.
 *   - **The reader may extend the window, never shorten it.** The five seconds
 *     in the plan is a floor. A caller that believes 800 ms is plenty is a
 *     caller that will make data loss feel instant, so `undoWindowMs` clamps
 *     upward and the check fails a hard-coded smaller value.
 *   - **A second destructive action does not steal the first one's undo.** At
 *     most `MAX_PENDING_UNDOS` windows are open at once. When a fourth arrives
 *     the oldest is returned as `overflow`, and the hook commits it
 *     immediately: a pending action must never be forgotten while it is still
 *     reversible, because forgetting it means either committing it without
 *     telling the reader or never committing it at all.
 *   - **Expiry is computed, not counted.** Every decision takes `nowMs` as an
 *     argument rather than reading a clock, so a throttled tab whose timers
 *     fire late still computes the same answer, and the whole module is
 *     decided in a Node probe without a browser or a fake timer.
 *
 * Pure on purpose: no React, no timers, no storage. The hook in
 * lib/hooks/use-undo.ts owns the single timer and the commit-once guard; this
 * module owns which entries are still reversible.
 */

/** The mandated undo window, in milliseconds (FEATURE_LIST item 156). */
export const UNDO_WINDOW_MS = 5000;

/** Longest window a caller may ask for, so a pending action cannot linger. */
export const MAX_UNDO_WINDOW_MS = 15000;

/** How many destructive actions may be reversible at the same time. */
export const MAX_PENDING_UNDOS = 3;

/** One deferred destructive action, as far as this module is concerned. */
export interface UndoWindowEntry {
  readonly id: string;
  readonly scheduledAtMs: number;
  readonly windowMs: number;
}

/** The window a caller asked for, raised to the floor and held to the ceiling. */
export function undoWindowMs(requested?: number): number {
  if (requested === undefined || !Number.isFinite(requested)) {
    return UNDO_WINDOW_MS;
  }
  return Math.min(MAX_UNDO_WINDOW_MS, Math.max(UNDO_WINDOW_MS, Math.round(requested)));
}

/** The instant this entry stops being reversible. */
export function undoExpiresAtMs(entry: UndoWindowEntry): number {
  return entry.scheduledAtMs + entry.windowMs;
}

/** Milliseconds left to undo, never negative. */
export function undoRemainingMs(entry: UndoWindowEntry, nowMs: number): number {
  return Math.max(0, undoExpiresAtMs(entry) - nowMs);
}

/** True once the window has closed, including exactly at its end. */
export function isUndoExpired(entry: UndoWindowEntry, nowMs: number): boolean {
  return undoRemainingMs(entry, nowMs) === 0;
}

/**
 * The soonest expiry among the entries, or null when there is nothing pending.
 * The hook arms one timer for this instant rather than one timer per entry,
 * which is what keeps the count of live timers equal to the count of pending
 * windows and not to the number of actions ever scheduled.
 */
export function nextExpiryMs(entries: readonly UndoWindowEntry[], nowMs: number): number | null {
  let soonest: number | null = null;
  for (const entry of entries) {
    const remaining = undoRemainingMs(entry, nowMs);
    if (remaining === 0) {
      return nowMs;
    }
    soonest = soonest === null ? remaining : Math.min(soonest, remaining);
  }
  return soonest === null ? null : nowMs + soonest;
}

/** Split entries into those whose window closed and those still reversible. */
export function splitExpired(
  entries: readonly UndoWindowEntry[],
  nowMs: number,
): { readonly expired: readonly UndoWindowEntry[]; readonly pending: readonly UndoWindowEntry[] } {
  const expired: UndoWindowEntry[] = [];
  const pending: UndoWindowEntry[] = [];
  for (const entry of entries) {
    (isUndoExpired(entry, nowMs) ? expired : pending).push(entry);
  }
  return { expired, pending };
}

/** Remove one entry by id. Removing an unknown id changes nothing. */
export function removeEntry(
  entries: readonly UndoWindowEntry[],
  id: string,
): readonly UndoWindowEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

/**
 * Add an entry, returning what has to be committed straight away.
 *
 * The oldest entry by schedule time is the one pushed out, not the first in
 * arrival order, so the overflow decision survives a caller that schedules
 * entries out of order.
 */
export function pushEntry(
  entries: readonly UndoWindowEntry[],
  entry: UndoWindowEntry,
): { readonly entries: readonly UndoWindowEntry[]; readonly overflow: readonly UndoWindowEntry[] } {
  const next = [...entries, entry];
  if (next.length <= MAX_PENDING_UNDOS) {
    return { entries: next, overflow: [] };
  }
  const sorted = [...next].sort((left, right) => left.scheduledAtMs - right.scheduledAtMs);
  const overflow = sorted.slice(0, next.length - MAX_PENDING_UNDOS);
  const overflowIds = new Set(overflow.map((candidate) => candidate.id));
  return {
    entries: next.filter((candidate) => !overflowIds.has(candidate.id)),
    overflow,
  };
}
