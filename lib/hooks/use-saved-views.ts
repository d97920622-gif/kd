// path: lib/hooks/use-saved-views.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t, tPlural } from '@/lib/i18n';
import { installLogoutClearSignal } from '@/lib/security/logout';
import {
  MAX_FILTER_KEYS,
  findView,
  parseSavedViews,
  projectFilterValues,
  removeView,
  renameView,
  saveView,
  savedViewsStorageKey,
  serializeSavedViews,
  type SavedView,
  type SavedViewFilters,
  type SavedViewOutcome,
} from '@/lib/usability/saved-views';
import { newId } from '@/lib/utils/id';

/**
 * Saved views for one list, owned by one reader (FEATURE_LIST item 995).
 *
 * The decisions - what may be stored, what a name may contain, how many views
 * fit and how stored bytes are validated - all live in
 * lib/usability/saved-views.ts, because those are the answers that must not
 * differ between two consumers. This file is the part that needs a browser:
 * the storage calls, the sign-out signal, the cross-tab read and the sentence
 * that reports what just happened.
 *
 * Four choices worth naming:
 *
 *   1. **The reader's identity is a prop, not a lookup.** Authentication
 *      arrives in step 3, and a hook that reached into a session to find an
 *      owner would have to be rewritten then. `ownerId` comes in from the
 *      caller, which is also what keeps two people on one device from sharing
 *      a list of views.
 *   2. **The keys are declared by the caller.** `keys` is the allowlist that
 *      decides which filter values may persist, so a free-text search box is
 *      persisted only if a caller says so. The list is read as a signature
 *      rather than as an array identity, so a caller that builds the array
 *      inline does not re-read storage on every render.
 *   3. **Anything the browser refuses is reported, not thrown.** Private
 *      windows that refuse storage, a full quota, a browser that blocks
 *      `localStorage` outright: all three end the same way - the sentence from
 *      the catalogue that says saved views are switched off here - and the
 *      page keeps working.
 *   4. **Signing out clears the list in this tab and in the others.** The hook
 *      subscribes to the sign-out signal from sub-step 1.26, and it also
 *      listens to the `storage` event so a second tab shows what the first one
 *      just saved. Both are one listener each, and both are the difference
 *      between a saved view and a leaked workspace on a shared device.
 */

/** What the last interaction did, so the caller can show one sentence. */
export type SavedViewsStatus = 'idle' | SavedViewOutcome | 'applied' | 'unavailable' | 'unreadable';

export interface UseSavedViewsOptions {
  /** The signed-in reader. A prop until step 3 owns the session. */
  readonly ownerId: string;
  /** The list these views belong to, for example 'invoices'. */
  readonly listId: string;
  /** Filter keys the caller allows a view to persist. Values must be scalars. */
  readonly keys: readonly string[];
}

export interface UseSavedViewsResult {
  readonly views: readonly SavedView[];
  /** False until the first read has happened, so a caller can hold its skeleton. */
  readonly ready: boolean;
  readonly status: SavedViewsStatus;
  /** One sentence for the reader, from the catalogue. Empty when nothing happened. */
  readonly message: string;
  /** "3 saved views", pluralised for the current count. */
  readonly countLabel: string;
  /** Save the current filters under a name. Saving a name again updates it. */
  readonly save: (name: string, values: Readonly<Record<string, unknown>>) => void;
  /** The filters of one view, or null when it is gone. */
  readonly apply: (id: string) => SavedViewFilters | null;
  readonly rename: (id: string, name: string) => void;
  readonly remove: (id: string) => void;
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

export function useSavedViews({
  ownerId,
  listId,
  keys,
}: UseSavedViewsOptions): UseSavedViewsResult {
  const storageKey = useMemo(() => savedViewsStorageKey(ownerId, listId), [ownerId, listId]);

  // The identity of a key list is its contents. Reading it as a signature keeps
  // an inline array literal from re-reading storage on every render. The
  // signature is split back apart rather than closing over `keys`, so the memo
  // has no dependency it cannot prove. A key cannot contain the separator: the
  // storage module only accepts identifiers.
  const signature = keys.join('|');
  const keyList = useMemo(() => signature.split('|').slice(0, MAX_FILTER_KEYS), [signature]);

  const [views, setViews] = useState<readonly SavedView[]>([]);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<SavedViewsStatus>('idle');
  const [touchedName, setTouchedName] = useState('');
  const viewsRef = useRef<readonly SavedView[]>([]);

  const commit = useCallback((next: readonly SavedView[]): void => {
    viewsRef.current = next;
    setViews(next);
  }, []);

  useEffect(() => {
    const stored = readStored(storageKey);
    if (!stored.ok) {
      setStatus('unavailable');
      setReady(true);
      return;
    }
    commit(parseSavedViews(stored.value, keyList));
    setReady(true);

    const unsubscribe = installLogoutClearSignal(() => {
      commit([]);
      setStatus('idle');
    });

    const onStorage = (event: StorageEvent): void => {
      if (event.key !== null && event.key !== storageKey) {
        return;
      }
      const latest = readStored(storageKey);
      if (latest.ok) {
        commit(parseSavedViews(latest.value, keyList));
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, [storageKey, keyList, commit]);

  const persist = useCallback(
    (next: readonly SavedView[]): boolean => {
      const written = writeStored(storageKey, serializeSavedViews(next));
      if (!written) {
        setStatus('unavailable');
        return false;
      }
      commit(next);
      return true;
    },
    [storageKey, commit],
  );

  const save = useCallback(
    (name: string, values: Readonly<Record<string, unknown>>): void => {
      const result = saveView(viewsRef.current, {
        id: newId(),
        name,
        filters: projectFilterValues(keyList, values),
        nowMs: Date.now(),
      });
      setTouchedName(name);
      if (result.outcome === 'limit_reached' || result.outcome === 'invalid_name') {
        setStatus(result.outcome);
        return;
      }
      if (!persist(result.views)) {
        return;
      }
      setStatus(result.outcome);
    },
    [keyList, persist],
  );

  const apply = useCallback((id: string): SavedViewFilters | null => {
    const view = findView(viewsRef.current, id);
    if (view === null) {
      setStatus('not_found');
      return null;
    }
    setTouchedName(view.name);
    setStatus('applied');
    return view.filters;
  }, []);

  const rename = useCallback(
    (id: string, name: string): void => {
      const result = renameView(viewsRef.current, id, name, Date.now());
      setTouchedName(name);
      if (result.outcome === 'invalid_name' || result.outcome === 'duplicate_name') {
        setStatus(result.outcome);
        return;
      }
      if (result.outcome === 'not_found') {
        setStatus('not_found');
        return;
      }
      if (!persist(result.views)) {
        return;
      }
      setStatus(result.outcome);
    },
    [persist],
  );

  const remove = useCallback(
    (id: string): void => {
      const target = findView(viewsRef.current, id);
      const result = removeView(viewsRef.current, id);
      setTouchedName(target === null ? '' : target.name);
      if (result.outcome === 'not_found') {
        setStatus('not_found');
        return;
      }
      if (!persist(result.views)) {
        return;
      }
      setStatus(result.outcome);
    },
    [persist],
  );

  const message = useMemo((): string => {
    switch (status) {
      case 'added':
        return t('usability.saved_views_created', { name: touchedName });
      case 'replaced':
        return t('usability.saved_views_updated', { name: touchedName });
      case 'renamed':
        return t('usability.saved_views_renamed', { name: touchedName });
      case 'removed':
        return t('usability.saved_views_removed', { name: touchedName });
      case 'applied':
        return t('usability.saved_views_applied', { name: touchedName });
      case 'invalid_name':
        return t('usability.saved_views_invalid_name');
      case 'duplicate_name':
        return t('usability.saved_views_duplicate_name');
      case 'limit_reached':
        return t('usability.saved_views_limit_reached');
      case 'unavailable':
      case 'unreadable':
        return t('usability.saved_views_unavailable');
      case 'not_found':
      case 'idle':
        return '';
      default:
        return '';
    }
  }, [status, touchedName]);

  return {
    views,
    ready,
    status,
    message,
    countLabel: tPlural('usability.saved_views_count', views.length, { count: views.length }),
    save,
    apply,
    rename,
    remove,
  };
}
