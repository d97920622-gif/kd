// path: lib/hooks/use-optimistic-record.ts
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { t } from '@/lib/i18n';
import {
  createQueue,
  enqueue,
  pendingMutations,
  project,
  rollback as rollbackQueue,
  settle as settleQueue,
  type OptimisticMutation,
  type OptimisticQueue,
} from '@/lib/usability/optimistic';
import { newId } from '@/lib/utils/id';

/**
 * Optimistic updates for one record or one list (FEATURE_LIST item 1854).
 *
 * The arithmetic of never losing an edit - a baseline, a queue of pure
 * functions, a fold on success and a re-application on failure - is in
 * lib/usability/optimistic.ts. This hook is the request, and it splits
 * "show the change" from "make the change real" on purpose:
 *
 *   - **`apply` shows the change and stops there.** Nothing is sent. That is
 *     what makes the hook compose with the undo window: a reader who removes a
 *     row sees it gone immediately, the request has not happened yet, and the
 *     undo is a real undo rather than a compensating write.
 *   - **`commit` sends the request** for everything up to and including that
 *     change, and settles it when the answer is a success or takes it back
 *     when the answer is a failure. Edits made after it are not part of that
 *     payload and not affected by its outcome.
 *   - **One request at a time.** A second `commit` while a request is in
 *     flight waits its turn instead of racing it, so two answers cannot arrive
 *     out of order and leave the projection holding the older one.
 *   - **A caller that wants instant feedback and an instant request** calls
 *     both, in that order, on the same line.
 *   - **Nothing adopts a new `initial` on its own.** A caller that re-reads
 *     the record calls `reset` with the value it received. An automatic adopt
 *     reads well until the day a caller passes an object literal, which is a
 *     new identity on every render: the hook would reset itself forever, and
 *     the symptom would be a record that cannot be edited. The explicit call
 *     is the one place that decision belongs.
 *
 * The record is generic: a list is just a record whose value is an array, which
 * is why there is one hook here and not a second one for tables.
 */

export type OptimisticStatus = 'idle' | 'pending' | 'confirmed' | 'rolled_back';

export interface UseOptimisticRecordOptions<T> {
  /** The value as the server last reported it. */
  readonly initial: T;
  /** The request that makes the applied changes real. */
  readonly request: (value: T) => Promise<void>;
}

export interface UseOptimisticRecordResult<T> {
  /** What the reader should see: the confirmed value plus the applied changes. */
  readonly value: T;
  /** How many changes are applied and not yet confirmed. */
  readonly pending: number;
  /** The change currently being sent, or null when nothing is in flight. */
  readonly inFlight: string | null;
  readonly status: OptimisticStatus;
  /** One sentence about the last outcome, from the catalogue. */
  readonly message: string;
  /** Show a change. Returns the id that commit and rollback take. */
  readonly apply: (update: (value: T) => T) => string;
  /** Send the request for everything up to and including this change. */
  readonly commit: (id: string) => void;
  /** Take this change back. Later changes stay, because they are re-applied. */
  readonly rollback: (id: string) => void;
  /**
   * Replace the confirmed value and drop every pending change. Call this when
   * the record has been re-read, and never while an edit is unsent.
   */
  readonly reset: (value: T) => void;
}

export function useOptimisticRecord<T>({
  initial,
  request,
}: UseOptimisticRecordOptions<T>): UseOptimisticRecordResult<T> {
  const [queue, setQueue] = useState<OptimisticQueue<T>>(() => createQueue(initial));
  const [status, setStatus] = useState<OptimisticStatus>('idle');
  const [inFlight, setInFlight] = useState<string | null>(null);

  const queueRef = useRef(queue);
  const requestRef = useRef(request);
  const inFlightRef = useRef<string | null>(null);
  const requestedRef = useRef<string[]>([]);
  const runRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  const publish = useCallback((next: OptimisticQueue<T>): void => {
    queueRef.current = next;
    setQueue(next);
  }, []);

  /** Send the next requested change, one at a time. */
  const run = useCallback((): void => {
    if (inFlightRef.current !== null) {
      return;
    }
    let queued = requestedRef.current.shift();
    while (queued !== undefined && indexOf(queueRef.current, queued) === -1) {
      // The change was taken back before its turn came, so there is nothing to
      // send and the next request in the list gets its chance.
      queued = requestedRef.current.shift();
    }
    if (queued === undefined) {
      return;
    }
    const id = queued;
    const upto = indexOf(queueRef.current, id) + 1;
    const payload = project({
      baseline: queueRef.current.baseline,
      mutations: queueRef.current.mutations.slice(0, upto),
    });
    inFlightRef.current = id;
    setInFlight(id);
    setStatus('pending');
    void requestRef.current(payload).then(
      () => {
        inFlightRef.current = null;
        setInFlight(null);
        publish(settleQueue(queueRef.current, id));
        setStatus('confirmed');
        runRef.current();
      },
      () => {
        inFlightRef.current = null;
        setInFlight(null);
        publish(rollbackQueue(queueRef.current, id));
        setStatus('rolled_back');
        runRef.current();
      },
    );
  }, [publish]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  const apply = useCallback(
    (update: (value: T) => T): string => {
      const mutation: OptimisticMutation<T> = { id: newId(), apply: update };
      const { queue: next } = enqueue(queueRef.current, mutation);
      publish(next);
      setStatus('pending');
      return mutation.id;
    },
    [publish],
  );

  const commit = useCallback((id: string): void => {
    requestedRef.current.push(id);
    runRef.current();
  }, []);

  const rollback = useCallback(
    (id: string): void => {
      if (inFlightRef.current === id) {
        // The change has already been sent, so taking it back is no longer a
        // local decision: a compensating request would be a second write to
        // undo the first. That is what the deferred undo window prevents, and
        // this guard is what keeps a late caller from pretending otherwise.
        return;
      }
      requestedRef.current = requestedRef.current.filter((candidate) => candidate !== id);
      publish(rollbackQueue(queueRef.current, id));
    },
    [publish],
  );

  const reset = useCallback(
    (value: T): void => {
      requestedRef.current = [];
      inFlightRef.current = null;
      setInFlight(null);
      publish(createQueue(value));
      setStatus('idle');
    },
    [publish],
  );

  const message = useMemo((): string => {
    switch (status) {
      case 'confirmed':
        return t('usability.optimistic_confirmed');
      case 'rolled_back':
        return t('usability.optimistic_rolled_back');
      case 'idle':
      case 'pending':
        return '';
      default:
        return '';
    }
  }, [status]);

  return {
    value: project(queue),
    pending: pendingMutations(queue),
    inFlight,
    status,
    message,
    apply,
    commit,
    rollback,
    reset,
  };
}

function indexOf<T>(queue: OptimisticQueue<T>, id: string): number {
  return queue.mutations.findIndex((mutation) => mutation.id === id);
}
