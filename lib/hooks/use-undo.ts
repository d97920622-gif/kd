// path: lib/hooks/use-undo.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useToast } from '@/lib/hooks/use-toast';
import { t } from '@/lib/i18n';
import {
  UNDO_WINDOW_MS,
  nextExpiryMs,
  pushEntry,
  removeEntry,
  splitExpired,
  undoWindowMs,
  type UndoWindowEntry,
} from '@/lib/usability/undo-window';
import { newId } from '@/lib/utils/id';

/**
 * Undo for a destructive action, on a five second window (FEATURE_LIST items
 * 156 and 1852).
 *
 * The window mathematics lives in lib/usability/undo-window.ts. What this hook
 * adds is the part that only exists in a running application, and each piece
 * is here because its absence loses something:
 *
 *   - **One timer.** The hook arms a single timeout for the soonest expiry and
 *     computes every other decision from `Date.now()` when it fires. A timer
 *     per entry would be a timer that leaks when a component unmounts mid
 *     window, and a countdown would be a number that disagrees with the clock
 *     on a throttled tab.
 *   - **Commit exactly once.** An id is marked settled before its commit runs,
 *     so a timer that fires late, a manual flush and an overflow decision can
 *     race each other without carrying out the same deletion twice.
 *   - **Nothing is left pending when the page goes away.** `pagehide` and the
 *     unmount cleanup flush what is pending. The design promises that a pending
 *     action has not been sent yet, so forgetting one on the way out would mean
 *     the reader's deletion silently never happened - the one outcome that is
 *     worse than either committing or reverting.
 *   - **A failed commit is reported, not swallowed.** The commit is the
 *     request that actually performs the action; when it fails the caller has
 *     to put its optimistic projection back, so the hook hands the failure back
 *     through `onCommitFailed` and states it in `outcome`.
 *
 * The hook never renders anything. `useUndoToast` is the pair for the pattern
 * the plan describes: the same window, offered in a toast with an Undo action.
 */

export interface UndoRequest {
  /** The name the reader sees in the toast, already resolved as display text. */
  readonly name: string;
  /** Carries out the action. Runs once, when the window closes. */
  readonly commit: () => void | Promise<void>;
  /** Puts the reader's view back. Runs once, only if they ask to undo. */
  readonly revert: () => void;
  /** Extend the window. A shorter value is raised to the mandated floor. */
  readonly windowMs?: number;
}

export type UndoOutcome = 'idle' | 'undone' | 'committed' | 'failed';

export interface UseUndoOptions {
  /** Called when a commit fails, so the caller can roll its projection back. */
  readonly onCommitFailed?: (id: string) => void;
}

export interface UseUndoResult {
  /** How many destructive actions are still reversible. */
  readonly pending: number;
  readonly outcome: UndoOutcome;
  /** Defer a destructive action. Returns the id that `undoNow` accepts. */
  readonly schedule: (request: UndoRequest) => string;
  /** Take back the newest pending action, or the one named by id. */
  readonly undoNow: (id?: string) => boolean;
  /** Carry out everything pending immediately, as a page exit does. */
  readonly flush: () => void;
}

export function useUndo({ onCommitFailed }: UseUndoOptions = {}): UseUndoResult {
  const [entries, setEntries] = useState<readonly UndoWindowEntry[]>([]);
  const [outcome, setOutcome] = useState<UndoOutcome>('idle');
  const entriesRef = useRef<readonly UndoWindowEntry[]>([]);
  const payloadsRef = useRef(new Map<string, UndoRequest>());
  const settledRef = useRef(new Set<string>());
  const failureRef = useRef(onCommitFailed);

  useEffect(() => {
    failureRef.current = onCommitFailed;
  }, [onCommitFailed]);

  const setEntriesBoth = useCallback((next: readonly UndoWindowEntry[]): void => {
    entriesRef.current = next;
    setEntries(next);
  }, []);

  const commitEntry = useCallback((id: string): void => {
    if (settledRef.current.has(id)) {
      return;
    }
    settledRef.current.add(id);
    const request = payloadsRef.current.get(id);
    payloadsRef.current.delete(id);
    if (request === undefined) {
      return;
    }
    try {
      const result = request.commit();
      if (result instanceof Promise) {
        result.then(
          () => {
            setOutcome('committed');
          },
          () => {
            setOutcome('failed');
            failureRef.current?.(id);
          },
        );
        return;
      }
      setOutcome('committed');
    } catch {
      setOutcome('failed');
      failureRef.current?.(id);
    }
  }, []);

  const runExpired = useCallback((): void => {
    const { expired, pending } = splitExpired(entriesRef.current, Date.now());
    if (expired.length === 0) {
      return;
    }
    setEntriesBoth(pending);
    for (const entry of expired) {
      commitEntry(entry.id);
    }
  }, [commitEntry, setEntriesBoth]);

  // One timer for the soonest expiry. It is re-armed whenever the list changes,
  // and it never outlives the component.
  useEffect(() => {
    const now = Date.now();
    const expiry = nextExpiryMs(entries, now);
    if (expiry === null) {
      return;
    }
    const timer = window.setTimeout(runExpired, Math.max(0, expiry - now));
    return () => {
      window.clearTimeout(timer);
    };
  }, [entries, runExpired]);

  const flush = useCallback((): void => {
    if (entriesRef.current.length === 0) {
      return;
    }
    const pending = entriesRef.current;
    setEntriesBoth([]);
    for (const entry of pending) {
      commitEntry(entry.id);
    }
  }, [commitEntry, setEntriesBoth]);

  // Leaving the page carries out what is pending: the promise of the window is
  // that nothing has been sent yet, and a reader who closes the tab while an
  // undo is on screen has decided to keep the action rather than to lose it.
  useEffect(() => {
    const onPageHide = (): void => {
      flush();
    };
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      flush();
    };
  }, [flush]);

  const schedule = useCallback(
    (request: UndoRequest): string => {
      const id = newId();
      payloadsRef.current.set(id, request);
      const entry: UndoWindowEntry = {
        id,
        scheduledAtMs: Date.now(),
        windowMs: undoWindowMs(request.windowMs),
      };
      const { entries: next, overflow } = pushEntry(entriesRef.current, entry);
      setEntriesBoth(next);
      setOutcome('idle');
      for (const pushed of overflow) {
        commitEntry(pushed.id);
      }
      return id;
    },
    [commitEntry, setEntriesBoth],
  );

  const undoNow = useCallback(
    (id?: string): boolean => {
      const current = entriesRef.current;
      const target =
        id === undefined ? current[current.length - 1] : current.find((entry) => entry.id === id);
      if (target === undefined || settledRef.current.has(target.id)) {
        return false;
      }
      settledRef.current.add(target.id);
      const request = payloadsRef.current.get(target.id);
      payloadsRef.current.delete(target.id);
      setEntriesBoth(removeEntry(current, target.id));
      if (request === undefined) {
        return false;
      }
      try {
        request.revert();
        setOutcome('undone');
        return true;
      } catch {
        // The projection belongs to the caller; a throw here means the caller's
        // own restore failed, and the window is closed either way.
        setOutcome('failed');
        return false;
      }
    },
    [setEntriesBoth],
  );

  return useMemo(
    () => ({ pending: entries.length, outcome, schedule, undoNow, flush }),
    [entries.length, outcome, schedule, undoNow, flush],
  );
}

export interface UseUndoToastResult {
  readonly pending: number;
  readonly outcome: UndoOutcome;
  /** One sentence about the last outcome, from the catalogue. */
  readonly message: string;
  /** Defer the action and offer the undo in a toast for the whole window. */
  readonly scheduleUndo: (request: UndoRequest) => void;
  readonly undoNow: (id?: string) => boolean;
  readonly flush: () => void;
}

/**
 * The pattern the plan describes: a destructive action, a toast, five seconds
 * of undo.
 *
 * The toast is pushed with the window itself as its duration, so the Undo
 * control disappears at the moment it stops being able to do anything. A
 * button that outlives its window is a button that silently does nothing when
 * it is pressed, and that is worse than an hour less of confidence.
 */
export function useUndoToast(): UseUndoToastResult {
  const toast = useToast();
  const undo = useUndo();

  const scheduleUndo = useCallback(
    (request: UndoRequest): void => {
      const id = undo.schedule(request);
      toast.push({
        title: t('usability.undo_toast_title', { name: request.name }),
        description: t('usability.undo_toast_description'),
        duration: UNDO_WINDOW_MS,
        action: {
          label: t('usability.undo_action'),
          onAction: () => {
            undo.undoNow(id);
          },
        },
      });
    },
    [toast, undo],
  );

  const message = useMemo((): string => {
    switch (undo.outcome) {
      case 'undone':
        return t('usability.undo_undone');
      case 'committed':
        return t('usability.undo_committed');
      case 'failed':
        return t('usability.undo_failed');
      case 'idle':
        return '';
      default:
        return '';
    }
  }, [undo.outcome]);

  return {
    pending: undo.pending,
    outcome: undo.outcome,
    message,
    scheduleUndo,
    undoNow: undo.undoNow,
    flush: undo.flush,
  };
}
