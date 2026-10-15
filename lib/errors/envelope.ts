// path: lib/errors/envelope.ts
/**
 * Response envelope builders.
 *
 * Canonical shapes (docs/PLAN/02_CONVENTIONS_AND_GUARDRAILS.md section 5):
 *
 *   success: { "data": T, "meta": { "correlation_id": "...", "page": {...} } }
 *   failure: { "error": { "code": "...", "message": "...", "details": [],
 *                         "correlation_id": "..." } }
 *
 * The failure builder is the only place that decides what a client may see.
 * It copies a fixed field list from the error, so an accidental extra
 * property on an error object can never reach a response body.
 *
 * The correlation id comes from the async context (lib/logger/correlation).
 * It is also returned as the x-correlation-id header so a user can quote one
 * value that ties the response to the logs.
 */
import { getCorrelationId } from '../logger/correlation';

import { type AppError } from './app-error';
import { logServerFault } from './error-logger';
import { normalizeError } from './normalize-error';

export interface PageMeta {
  /** Opaque cursor for the next page, or null at the end of the list. */
  readonly next_cursor: string | null;
  /** Cursor this page started from, or null for the first page. */
  readonly cursor: string | null;
  /** True when more records are available. */
  readonly has_more: boolean;
  /** Maximum records requested for this page. */
  readonly limit: number;
  /** Total records, only when the count is cheap. */
  readonly total?: number;
}

export interface SuccessMeta {
  readonly correlation_id: string;
  readonly page?: PageMeta;
}

export interface SuccessEnvelope<T> {
  readonly data: T;
  readonly meta: SuccessMeta;
}

export interface FailureEnvelope {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details: readonly { path?: string; code?: string; message: string }[];
    readonly correlation_id: string;
    readonly retry_after_seconds?: number;
  };
}

/** Build a success envelope with a correlation id from the active context. */
export function successEnvelope<T>(
  data: T,
  options: { correlationId?: string; page?: PageMeta } = {},
): SuccessEnvelope<T> {
  const correlationId = options.correlationId ?? getCorrelationId();
  const meta: SuccessMeta =
    options.page === undefined
      ? { correlation_id: correlationId }
      : { correlation_id: correlationId, page: options.page };
  return { data, meta };
}

/** Build a failure envelope from a typed error. */
export function failureEnvelope(
  error: AppError,
  options: { correlationId?: string } = {},
): FailureEnvelope {
  const correlationId = options.correlationId ?? getCorrelationId();
  const payload: FailureEnvelope['error'] = {
    code: error.code,
    message: error.clientMessage,
    details: error.details.map((detail) => ({
      ...(detail.path === undefined ? {} : { path: detail.path }),
      ...(detail.code === undefined ? {} : { code: detail.code }),
      message: detail.message,
    })),
    correlation_id: correlationId,
    ...(error.retryAfterSeconds === undefined
      ? {}
      : { retry_after_seconds: error.retryAfterSeconds }),
  };
  return { error: payload };
}

/** Headers added to every envelope response. */
export function envelopeHeaders(correlationId: string): Record<string, string> {
  return {
    'content-type': 'application/json; charset=utf-8',
    'x-correlation-id': correlationId,
    'x-content-type-options': 'nosniff',
  };
}

/** JSON success response with the canonical envelope and no-store caching. */
export function successResponse<T>(
  data: T,
  options: { correlationId?: string; page?: PageMeta; status?: number } = {},
): Response {
  const envelope = successEnvelope(data, options);
  const correlationId = envelope.meta.correlation_id;
  return new Response(JSON.stringify(envelope), {
    status: options.status ?? 200,
    headers: {
      ...envelopeHeaders(correlationId),
      'cache-control': 'no-store',
    },
  });
}

/** JSON failure response with the canonical envelope and retry hint. */
export function failureResponse(
  error: unknown,
  options: { correlationId?: string; status?: number } = {},
): Response {
  const normalized = normalizeError(error);
  // A server fault is logged before the response is built, so the internal
  // detail reaches the log even when the caller builds a response directly.
  logServerFault(normalized);
  const envelope = failureEnvelope(normalized, options);
  const correlationId = envelope.error.correlation_id;
  const headers: Record<string, string> = {
    ...envelopeHeaders(correlationId),
    'cache-control': 'no-store',
  };
  if (normalized.retryAfterSeconds !== undefined) {
    headers['retry-after'] = String(normalized.retryAfterSeconds);
  }
  return new Response(JSON.stringify(envelope), {
    status: options.status ?? normalized.status,
    headers,
  });
}
