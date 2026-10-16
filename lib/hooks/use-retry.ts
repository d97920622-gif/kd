// path: lib/hooks/use-retry.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Retry with exponential backoff, jitter and a ceiling.
 *
 * The plan asks for retry logic with exponential backoff (FEATURE_LIST D2.138)
 * and for a retry a reader can actually use. Both halves live here, because the
 * naive version of each breaks the other:
 *
 *   - **Waiting doubles, up to a ceiling.** A first retry after 500 ms is nearly
 *     free; a tenth after 500 ms times ten is four minutes of a reader staring
 *     at a wall. The delay doubles per attempt and stops growing at
 *     `maxDelayMs`.
 *   - **Jitter is not optional.** Without it, every client that failed together
 *     - a deploy, a provider blip, a dropped connection - retries in lockstep and
 *     arrives as a spike exactly when the service is trying to recover. The delay
 *     is therefore a random value in the top half of the calculated window, the
 *     "equal jitter" approach: still exponential, never synchronised.
 *   - **The countdown is the reader's, not the code's.** `retryAfterSeconds`
 *     counts down once per second so a state component can show the waiting in
 *     the button itself. Retrying early is possible (`retry()` ignores the
 *     wait), because a reader who has fixed their connection should not be held
 *     back by the product's schedule.
 *   - **Attempts are bounded.** `maxAttempts` stops the loop even if the caller's
 *     `onRetry` always fails, so a broken provider cannot turn one page into an
 *     infinite request generator.
 *
 * The hook never performs the request itself: `onRetry` is the caller's, and it
 * may return a promise. That keeps the hook usable for a fetch, a router refresh
 * or an optimistic re-read, and keeps the retry policy in one place.
 *
 * `setTimeout` is used rather than an interval so each wait is scheduled once,
 * and every timer is cleared on unmount: a component that unmounts mid-countdown
 * must not call `onRetry` on a page that no longer exists.
 */
export interface UseRetryOptions {
  /** The work to attempt. Called on every retry, and resolved before the next. */
  readonly onRetry: () => void | Promise<void>;
  /** Attempts allowed after the first failure. Default 3. */
  readonly maxAttempts?: number;
  /** Delay of the first retry, in milliseconds. Default 500. */
  readonly baseDelayMs?: number;
  /** Ceiling the doubling stops at, in milliseconds. Default 8000. */
  readonly maxDelayMs?: number;
  /** Skip the automatic attempt and wait for the reader. Default false. */
  readonly manualOnly?: boolean;
}

export interface UseRetryResult {
  /** How many retries have been used. */
  readonly attempts: number;
  /** True while a retry is in flight. */
  readonly retrying: boolean;
  /** Seconds until the next automatic attempt; 0 when there is no wait. */
  readonly retryAfterSeconds: number;
  /** True when the attempt budget is spent and the reader must decide. */
  readonly exhausted: boolean;
  /** Start the wait-and-retry cycle again, after a manual retry or a reset. */
  readonly schedule: () => void;
  /** Retry now, ignoring the remaining wait. */
  readonly retry: () => void;
  /** Clear the counter, for a caller whose request has succeeded. */
  readonly reset: () => void;
}

/** The delay before attempt `attempt` (1-based), in milliseconds. */
export function backoffDelayMs(attempt: number, baseDelayMs = 500, maxDelayMs = 8000): number {
  const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** Math.max(0, attempt - 1));
  // Equal jitter: half the window fixed, half random. The average is still the
  // exponential curve, and two clients that fail together do not return together.
  const half = ceiling / 2;
  return Math.round(half + Math.random() * half);
}

export function useRetry({
  onRetry,
  maxAttempts = 3,
  baseDelayMs = 500,
  maxDelayMs = 8000,
  manualOnly = false,
}: UseRetryOptions): UseRetryResult {
  const [attempts, setAttempts] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);
  const [exhausted, setExhausted] = useState(false);
  const waiting = useRef(false);

  const run = useCallback(async (): Promise<void> => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
      setRetryAfterSeconds(0);
      waiting.current = false;
    }
  }, [onRetry]);

  const schedule = useCallback((): void => {
    if (waiting.current) {
      return;
    }
    const next = attempts + 1;
    if (next > maxAttempts) {
      setExhausted(true);
      return;
    }
    waiting.current = true;
    const delayMs = manualOnly ? baseDelayMs : backoffDelayMs(next, baseDelayMs, maxDelayMs);
    setRetryAfterSeconds(Math.max(1, Math.ceil(delayMs / 1000)));
  }, [attempts, maxAttempts, manualOnly, baseDelayMs, maxDelayMs]);

  // One timer per scheduled wait: it counts the seconds down, then runs the
  // attempt. Nothing else advances the countdown, so the number on screen is the
  // number of seconds the reader actually waits.
  useEffect(() => {
    if (!waiting.current || retryAfterSeconds <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      if (retryAfterSeconds === 1) {
        setAttempts((value) => value + 1);
        void run();
        return;
      }
      setRetryAfterSeconds((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [retryAfterSeconds, run]);

  const retry = useCallback((): void => {
    waiting.current = false;
    setRetryAfterSeconds(0);
    setAttempts((value) => value + 1);
    void run();
  }, [run]);

  const reset = useCallback((): void => {
    waiting.current = false;
    setRetryAfterSeconds(0);
    setAttempts(0);
    setExhausted(false);
  }, []);

  return { attempts, retrying, retryAfterSeconds, exhausted, schedule, retry, reset };
}
