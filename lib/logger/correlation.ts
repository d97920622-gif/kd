// path: lib/logger/correlation.ts
/**
 * Correlation id generation and async propagation for the structured logger.
 *
 * Every request, job and background task runs inside a correlation context.
 * The id is carried through the whole async call chain with
 * AsyncLocalStorage, so any log line written below the entry point reports
 * the same correlation id without passing it through every function
 * signature.
 *
 * Incoming ids (for example the x-correlation-id header) are accepted only
 * when they match a strict character set. Anything else is replaced with a
 * fresh id, so a hostile header value can never reach a log sink or a
 * response header.
 *
 * Server-side module: it depends on node:async_hooks and must not be
 * imported by browser code.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

/** Request and response header that carries the correlation id. */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/** Placeholder used when no correlation context is active. */
export const SYSTEM_CORRELATION_ID = 'system';

const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;

interface CorrelationStore {
  readonly correlationId: string;
}

const storage = new AsyncLocalStorage<CorrelationStore>();

/** Generate a new correlation id (RFC 4122 UUID version 4). */
export function newCorrelationId(): string {
  return randomUUID();
}

/** True when the value is a safe correlation id. */
export function isCorrelationId(value: unknown): value is string {
  return typeof value === 'string' && CORRELATION_ID_PATTERN.test(value);
}

/** Accept a safe id or produce a fresh one. Never returns an unsafe value. */
export function normalizeCorrelationId(value: string | null | undefined): string {
  return isCorrelationId(value) ? value : newCorrelationId();
}

/** Correlation id of the active context, or the system placeholder. */
export function getCorrelationId(): string {
  return storage.getStore()?.correlationId ?? SYSTEM_CORRELATION_ID;
}

/**
 * Run a function inside a correlation context. A missing or unsafe id is
 * replaced with a fresh one. Works for synchronous and asynchronous work.
 */
export function withCorrelationId<T>(correlationId: string | undefined, run: () => T): T {
  const id = normalizeCorrelationId(correlationId);
  return storage.run({ correlationId: id }, run);
}

/** Run a function inside a context with a freshly generated id. */
export function withNewCorrelationId<T>(run: () => T): T {
  return withCorrelationId(undefined, run);
}
