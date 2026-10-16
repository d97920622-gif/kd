// path: lib/usability/optimistic.ts
/**
 * Optimistic updates: show the change now, keep the truth straight later.
 *
 * FEATURE_LIST item 1854 asks for optimistic UI with rollback - instant
 * feedback and server sync. The naive version of that is a single "previous
 * value" variable, and it is wrong in one specific way that shows up in
 * production: two edits in flight, the first fails, and restoring the previous
 * value throws away the second edit as well. The reader sees their last
 * keystroke vanish because of a request they never saw fail.
 *
 * So the pending work is a queue rather than a variable, and the projection is
 * a fold:
 *
 *   - **`baseline` is the last value the server confirmed.** Nothing is
 *     written into it until a mutation is settled.
 *   - **`mutations` are the edits applied on top, in order.** What the reader
 *     sees is always `project(queue)`, which is the baseline with every
 *     pending mutation applied.
 *   - **Settling folds a mutation into the baseline**, together with the ones
 *     before it, and leaves the later ones pending. That is what a successful
 *     request means.
 *   - **Rolling back drops one mutation and re-applies the rest.** The later
 *     edit survives, because its function is re-run against the baseline
 *     without the failed one. This is the whole point of the module: a failed
 *     request costs the reader exactly the change that failed.
 *
 * Two contracts the caller has to keep, both enforced by the check:
 *
 *   1. `apply` must be pure. It is re-run during a rollback against a
 *      different input, so a function that reads a clock, a counter or a
 *      mutable outer value would produce a different edit the second time.
 *   2. A mutation is settled or rolled back exactly once. The hook tracks
 *      that; this module simply has nothing to do with an id it no longer
 *      holds, so a late duplicate call is harmless rather than destructive.
 *
 * Pure on purpose: no React, no promises, no clock. The hook
 * (lib/hooks/use-optimistic-record.ts) owns the request, the in-flight guard
 * and the status; the mathematics of never losing an edit is decided here and
 * proved in a Node probe.
 */

/** Pending mutations allowed on one record before the oldest is folded in. */
export const MAX_PENDING_MUTATIONS = 5;

/** One pending edit: an identity and a pure function of the value. */
export interface OptimisticMutation<T> {
  readonly id: string;
  readonly apply: (value: T) => T;
}

/** The confirmed value plus the edits stacked on top of it. */
export interface OptimisticQueue<T> {
  readonly baseline: T;
  readonly mutations: readonly OptimisticMutation<T>[];
}

/** A queue with nothing pending. */
export function createQueue<T>(baseline: T): OptimisticQueue<T> {
  return { baseline, mutations: [] };
}

/** The value the reader should see: the baseline with every pending edit applied. */
export function project<T>(queue: OptimisticQueue<T>): T {
  return queue.mutations.reduce<T>((value, mutation) => mutation.apply(value), queue.baseline);
}

/** How many edits are waiting for an answer. */
export function pendingMutations<T>(queue: OptimisticQueue<T>): number {
  return queue.mutations.length;
}

/** True when this mutation is still pending. */
export function contains<T>(queue: OptimisticQueue<T>, id: string): boolean {
  return queue.mutations.some((mutation) => mutation.id === id);
}

/** Pending mutation ids, oldest first, for a caller that reports state. */
export function mutationIds<T>(queue: OptimisticQueue<T>): readonly string[] {
  return queue.mutations.map((mutation) => mutation.id);
}

/**
 * Add a mutation. When the queue is full the oldest mutation is folded into
 * the baseline and returned as `settled`: its edit stays visible, only its
 * revertibility is given up, and the caller can say so. Dropping it instead
 * would make the reader's own edit disappear for no reason they could see.
 */
export function enqueue<T>(
  queue: OptimisticQueue<T>,
  mutation: OptimisticMutation<T>,
): { readonly queue: OptimisticQueue<T>; readonly settled: readonly string[] } {
  const next = [...queue.mutations, mutation];
  if (next.length <= MAX_PENDING_MUTATIONS) {
    return { queue: { ...queue, mutations: next }, settled: [] };
  }
  const foldCount = next.length - MAX_PENDING_MUTATIONS;
  const folded = next.slice(0, foldCount);
  const baseline = folded.reduce<T>((value, candidate) => candidate.apply(value), queue.baseline);
  return {
    queue: { baseline, mutations: next.slice(foldCount) },
    settled: folded.map((candidate) => candidate.id),
  };
}

/**
 * Confirm a mutation. Everything up to and including it becomes part of the
 * baseline; later edits stay pending and keep their order.
 */
export function settle<T>(queue: OptimisticQueue<T>, id: string): OptimisticQueue<T> {
  const index = queue.mutations.findIndex((mutation) => mutation.id === id);
  if (index === -1) {
    return queue;
  }
  const folded = queue.mutations.slice(0, index + 1);
  const baseline = folded.reduce<T>((value, mutation) => mutation.apply(value), queue.baseline);
  return { baseline, mutations: queue.mutations.slice(index + 1) };
}

/**
 * Abandon a mutation. The baseline is untouched and the remaining edits are
 * re-applied without it, so a failure removes one change and no other.
 */
export function rollback<T>(queue: OptimisticQueue<T>, id: string): OptimisticQueue<T> {
  const mutations = queue.mutations.filter((mutation) => mutation.id !== id);
  return mutations.length === queue.mutations.length ? queue : { ...queue, mutations };
}

/** Everything is confirmed: the projection becomes the baseline. */
export function settleAll<T>(queue: OptimisticQueue<T>): OptimisticQueue<T> {
  return createQueue(project(queue));
}
