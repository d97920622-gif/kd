// path: lib/hooks/use-autosave.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type ZodType } from 'zod';

import { useRetry } from '@/lib/hooks/use-retry';
import { t } from '@/lib/i18n';
import { installLogoutClearSignal } from '@/lib/security/logout';
import {
  AUTOSAVE_DELAY_MS,
  draftStorageKey,
  findDeniedKey,
  parseDraft,
  serializeDraft,
  shouldAdoptDraft,
  shouldWriteDraft,
  type DraftEnvelope,
} from '@/lib/usability/draft';
import { formatUtcTimestamp } from '@/lib/usability/explainability';

/**
 * Autosave: keep the reader's unfinished work, and say where it is kept
 * (FEATURE_LIST items 1848 and 1855).
 *
 * The storage rules - the envelope, the size cap, the denied keys, the
 * stale-write guard - live in lib/usability/draft.ts. This hook is the timer,
 * the status and the recovery offer. It takes a schema rather than assuming a
 * shape, because a draft read back out of a browser is untrusted input and
 * only the caller knows what its own record looks like.
 *
 * What each state means, since the indicator is the whole point of the item:
 *
 *   - `idle` - nothing has changed since the draft was written.
 *   - `pending` - there are unsaved keystrokes inside the debounce window.
 *   - `saving` - the draft is written and the server save is running.
 *   - `saved` - the work is in this browser, with the instant it was kept.
 *   - `failed` - the write or the server save failed. The retry policy is the
 *     bounded backoff from sub-step 1.24, so a browser that refuses storage
 *     cannot turn one keystroke into an endless loop, and the sentence changes
 *     when the attempts are spent.
 *   - `blocked` - the draft may not be written at all: it holds a key a draft
 *     may never store, or it is larger than the cap. A refusal is not a
 *     failure, and the sentence says which one it was.
 *   - `recovered` - a draft newer than the loaded record is available and has
 *     not been applied. The reader decides; a hook that silently replaced the
 *     field they are looking at would be the bug it is meant to prevent.
 *
 * Two details that exist because their absence breaks the timer rather than
 * the type check: `save` and `schema` are held in refs, so a caller that
 * passes an inline function or an inline schema does not restart the debounce
 * on every render (a debounce that restarts forever never fires), and the
 * retry callback is stable for the same reason inside useRetry.
 */

export type AutosaveStatus =
  'idle' | 'pending' | 'saving' | 'saved' | 'failed' | 'blocked' | 'recovered';

export interface UseAutosaveOptions<T> {
  /** The signed-in reader. A prop until step 3 owns the session. */
  readonly ownerId: string;
  /** The list the record belongs to, for example 'invoices'. */
  readonly listId: string;
  /** The record being edited. Drafts are kept per record, not per list. */
  readonly recordId: string;
  /** The current value of the form. Every change restarts the debounce. */
  readonly value: T;
  /** Validates a stored payload before it is offered back. */
  readonly schema: ZodType<T>;
  /** When the record was loaded, so a draft older than it is not offered. */
  readonly recordUpdatedAtMs?: number | null;
  /** Persist the value on the server. Omit for a draft-only surface. */
  readonly save?: (value: T) => Promise<void>;
  /** Off for a form that is not editable yet: nothing is read, nothing is written. */
  readonly enabled?: boolean;
}

export interface UseAutosaveResult<T> {
  readonly status: AutosaveStatus;
  /** One sentence for the indicator, from the catalogue. */
  readonly statusMessage: string;
  /** When the draft was kept, as a UTC label, or null. */
  readonly keptAtLabel: string | null;
  /** The draft offered for recovery, already validated, or null. */
  readonly recovery: T | null;
  /** How many retries the current failure has used. */
  readonly attempts: number;
  /** Take the draft. Returns it, because the caller owns the form state. */
  readonly recover: () => T | null;
  /** Refuse the draft and remove it from this browser. */
  readonly discard: () => void;
  /** Write now, without waiting for the debounce. */
  readonly saveNow: () => void;
}

function readStored(key: string | null): { readonly ok: boolean; readonly value: string | null } {
  if (key === null || typeof window === 'undefined') {
    return { ok: false, value: null };
  }
  try {
    return { ok: true, value: window.localStorage.getItem(key) };
  } catch {
    return { ok: false, value: null };
  }
}

function writeStored(key: string | null, value: string): boolean {
  if (key === null || typeof window === 'undefined') {
    return false;
  }
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function useAutosave<T>({
  ownerId,
  listId,
  recordId,
  value,
  schema,
  recordUpdatedAtMs = null,
  save,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult<T> {
  const storageKey = useMemo(
    () => draftStorageKey(ownerId, listId, recordId),
    [ownerId, listId, recordId],
  );

  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [keptAt, setKeptAt] = useState<number | null>(null);
  const [recovery, setRecovery] = useState<T | null>(null);
  const [blockedReason, setBlockedReason] = useState<'denied' | 'size'>('denied');

  const valueRef = useRef(value);
  const schemaRef = useRef(schema);
  const saveRef = useRef(save);
  const firstRunRef = useRef(true);
  const recoveryRef = useRef<T | null>(null);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    schemaRef.current = schema;
  }, [schema]);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  /** Write one draft, or say why it may not be written. */
  const writeDraft = useCallback(
    (payload: T): 'saved' | 'blocked' | 'failed' => {
      const envelope: DraftEnvelope = { version: 1, updatedAtMs: Date.now(), payload };
      const serialized = serializeDraft(envelope);
      if (serialized === null) {
        setBlockedReason(findDeniedKey(payload) === null ? 'size' : 'denied');
        return 'blocked';
      }
      const stored = parseDraft(readStored(storageKey).value);
      if (!shouldWriteDraft(stored, envelope)) {
        // A newer draft from another tab is already stored. Keeping the newer
        // one is the multi-tab rule: a backgrounded tab must not roll the
        // reader back to an earlier keystroke.
        return 'saved';
      }
      if (!writeStored(storageKey, serialized)) {
        return 'failed';
      }
      setKeptAt(envelope.updatedAtMs);
      return 'saved';
    },
    [storageKey],
  );

  /**
   * The whole attempt: draft first, server second, status either way.
   *
   * The return value is what the caller has to act on synchronously. A server
   * save that has not answered yet returns `saving`: its failure arrives later
   * and schedules its own retry from inside the rejection handler, so the
   * debounce and the retry timer never both own the same failure.
   */
  const attempt = useCallback(
    (payload: T): 'saved' | 'blocked' | 'failed' | 'saving' => {
      const draftResult = writeDraft(payload);
      if (draftResult === 'blocked') {
        setStatus('blocked');
        return 'blocked';
      }
      if (draftResult === 'failed') {
        setStatus('failed');
        return 'failed';
      }
      const saver = saveRef.current;
      if (saver === undefined) {
        setStatus('saved');
        return 'saved';
      }
      setStatus('saving');
      void saver(payload).then(
        () => {
          retryRef.current.reset();
          setStatus('saved');
        },
        () => {
          setStatus('failed');
          retryRef.current.schedule();
        },
      );
      return 'saving';
    },
    [writeDraft],
  );

  const retry = useRetry({
    onRetry: () => {
      attempt(valueRef.current);
    },
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 8000,
  });
  const retryRef = useRef(retry);
  useEffect(() => {
    retryRef.current = retry;
  }, [retry]);

  // Recover on mount: read once, validate with the caller's schema, and offer
  // the draft only when it is newer than the record the page loaded.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const stored = parseDraft(readStored(storageKey).value);
    if (stored === null || !shouldAdoptDraft(stored, recordUpdatedAtMs)) {
      return;
    }
    const parsed = schemaRef.current.safeParse(stored.payload);
    if (!parsed.success) {
      return;
    }
    setRecovery(parsed.data);
    recoveryRef.current = parsed.data;
    setKeptAt(stored.updatedAtMs);
    setStatus('recovered');

    return installLogoutClearSignal(() => {
      setRecovery(null);
      recoveryRef.current = null;
      setKeptAt(null);
      setStatus('idle');
    });
  }, [enabled, storageKey, recordUpdatedAtMs]);

  // Debounce. Every change restarts the quiet period, and the first render
  // does not write a draft of a form the reader has not touched yet.
  useEffect(() => {
    if (!enabled) {
      return;
    }
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    setStatus('pending');
    const timer = window.setTimeout(() => {
      if (attempt(valueRef.current) === 'failed') {
        retryRef.current.schedule();
      }
    }, AUTOSAVE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [enabled, value, attempt]);

  const saveNow = useCallback((): void => {
    if (attempt(valueRef.current) === 'failed') {
      retryRef.current.schedule();
    }
  }, [attempt]);

  const recover = useCallback((): T | null => {
    const draft = recoveryRef.current;
    if (draft === null) {
      return null;
    }
    setRecovery(null);
    recoveryRef.current = null;
    setStatus('saved');
    return draft;
  }, []);

  const discard = useCallback((): void => {
    setRecovery(null);
    recoveryRef.current = null;
    if (storageKey !== null && typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // Nothing to do here: the draft stays in this browser, and the next
        // mount offers it again rather than pretending it was removed.
      }
    }
    setStatus('idle');
  }, [storageKey]);

  const statusMessage = useMemo((): string => {
    switch (status) {
      case 'idle':
        return t('usability.autosave_status_idle');
      case 'pending':
        return t('usability.autosave_status_pending');
      case 'saving':
        return t('usability.autosave_status_saving');
      case 'saved':
        return t('usability.autosave_status_saved');
      case 'failed':
        return retry.exhausted
          ? t('usability.autosave_status_exhausted')
          : t('usability.autosave_status_failed');
      case 'recovered':
        return t('usability.autosave_status_recovered');
      case 'blocked':
        return t(
          blockedReason === 'denied'
            ? 'usability.autosave_denied_note'
            : 'usability.autosave_size_note',
        );
      default:
        return '';
    }
  }, [status, blockedReason, retry.exhausted]);

  return {
    status,
    statusMessage,
    keptAtLabel: keptAt === null ? null : formatUtcTimestamp(keptAt),
    recovery,
    attempts: retry.attempts,
    recover,
    discard,
    saveNow,
  };
}
