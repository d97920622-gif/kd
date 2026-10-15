// path: lib/errors/normalize-error.ts
/**
 * Normalization of unknown thrown values into typed AppError instances.
 *
 * A route handler or a job catches anything: our own errors, Zod failures,
 * database driver errors, provider responses, plain strings or nothing at
 * all. This module is the single conversion point, so every response and
 * every log line has a typed code to work with.
 *
 * Rules:
 *   - An AppError passes through unchanged.
 *   - A ZodError becomes a ValidationError whose details carry the field
 *     path and the English message, which is safe for the caller.
 *   - An abort or timeout shape becomes a TimeoutError.
 *   - Anything else becomes an InternalError that keeps the original value as
 *     its cause and never exposes it.
 *
 * Step 2 appends the database error mapping here (Postgres SQLSTATE to typed
 * errors) through the append protocol; this file stays the only normalizer.
 */
import { ZodError } from 'zod';

import { type AppError, isAppError } from './app-error';
import { InternalError, TimeoutError, ValidationError } from './error-classes';

import type { ErrorDetail } from './error-detail';

/** Convert a ZodError into validation details. */
export function detailsFromZodError(error: ZodError): ErrorDetail[] {
  return error.issues.map((issue) => {
    const path = issue.path.map((segment) => String(segment)).join('.');
    return {
      ...(path.length > 0 ? { path } : {}),
      code: issue.code,
      message: issue.message,
    };
  });
}

function looksLikeAbort(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as { name?: unknown; code?: unknown };
  return record.name === 'AbortError' || record.code === 'ABORT_ERR';
}

/** True when the value is a PostgreSQL or Supabase driver error. */
export function isDatabaseError(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const code = (value as { code?: unknown }).code;
  return typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code);
}

/**
 * Normalize any thrown value into an AppError.
 * The second return value tells a caller whether the input was already typed.
 */
export function normalizeError(value: unknown): AppError {
  if (isAppError(value)) {
    return value;
  }
  if (value instanceof ZodError) {
    return new ValidationError({
      details: detailsFromZodError(value),
      internalMessage: `zod validation failed: ${value.issues.length} issue(s)`,
      cause: value,
    });
  }
  if (value instanceof Error) {
    if (looksLikeAbort(value)) {
      return new TimeoutError({ internalMessage: value.message, cause: value });
    }
    if (value.name === 'TimeoutError') {
      return new TimeoutError({ internalMessage: value.message, cause: value });
    }
    return new InternalError({ internalMessage: value.message, cause: value });
  }
  return new InternalError({
    internalMessage: `non-error value thrown: ${describeValue(value)}`,
    cause: value,
  });
}

/** Short, safe description of an unknown thrown value for the internal log. */
export function describeValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  const kind = typeof value;
  if (kind === 'string') {
    return `string(${(value as string).length} chars)`;
  }
  if (kind === 'number' || kind === 'boolean' || kind === 'bigint') {
    return `${kind}(${String(value)})`;
  }
  if (kind === 'symbol') {
    return 'symbol';
  }
  if (kind === 'function') {
    return 'function';
  }
  if (value instanceof Error) {
    return `error(${value.name})`;
  }
  return `object(${Object.prototype.toString.call(value)})`;
}
