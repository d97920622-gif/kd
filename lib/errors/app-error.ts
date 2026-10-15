// path: lib/errors/app-error.ts
/**
 * AppError: the base class of every error the platform raises.
 *
 * Two audiences, two shapes:
 *   - The client receives a failure envelope: code, English message, safe
 *     details and the correlation id. Nothing else.
 *   - The structured logger receives the internal message, the cause chain
 *     and the stack, because that is what a human debugs.
 *
 * The split is enforced by the `exposeMessage` flag. An error that carries
 * internal text (SQL state, provider response, file path) sets
 * exposeMessage to false and the user-facing message falls back to the
 * catalogue default for its code. `InternalError` always behaves that way.
 *
 * This module imports only the catalogue, so it stays safe to load on the
 * very first line of the boot path.
 */
import {
  buildEntityCode,
  type ErrorCodeSuffix,
  defaultMessageForCode,
  isResourceSlug,
  isRetryableCode,
  statusForCode,
} from './error-codes';
import { type ErrorDetail } from './error-detail';

export { type ErrorDetail } from './error-detail';

export interface AppErrorOptions {
  /** Client-facing message. Ignored when exposeMessage is false. */
  readonly message?: string;
  /** Internal message for the log. Never returned to a client. */
  readonly internalMessage?: string;
  /** Specific code, for example invoice_not_found. Defaults from the class. */
  readonly code?: string;
  /** Entity slug used to build the code, for example invoice. */
  readonly resource?: string;
  /** Suffix used with the resource to build the code. */
  readonly codeSuffix?: ErrorCodeSuffix;
  /** Field-level or rule-level detail safe to return to the client. */
  readonly details?: readonly ErrorDetail[];
  /** Underlying error or value. Logged, never returned. */
  readonly cause?: unknown;
  /** Seconds a caller should wait before retrying, for 429 and 503. */
  readonly retryAfterSeconds?: number;
  /** False when the message must not be shown to the user. Default true. */
  readonly exposeMessage?: boolean;
}

const MAX_DETAIL_MESSAGE_LENGTH = 400;

/** Longest internal message kept for the log line. */
export const MAX_INTERNAL_MESSAGE_LENGTH = 2000;

/** Trim and cut a detail message so a response body stays bounded. */
export function normalizeDetailMessage(message: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_DETAIL_MESSAGE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_DETAIL_MESSAGE_LENGTH)}...`;
}

export class AppError extends Error {
  /** Stable public code, for example payment_not_found. */
  readonly code: string;
  /** HTTP status for this error. */
  readonly status: number;
  /** Safe, bounded details for the client. */
  readonly details: readonly ErrorDetail[];
  /** Seconds to wait before retrying, when applicable. */
  readonly retryAfterSeconds?: number;
  /** True when the message may be returned to a client. */
  readonly exposeMessage: boolean;
  /** True for expected, handled conditions; false for defects. */
  readonly isOperational: boolean;
  /** Internal message for the log; equals the client message when safe. */
  readonly internalMessage: string;
  /** True when this error type carries a "not found" meaning. */
  readonly isNotFound: boolean;
  /** True when this error type carries an authentication meaning. */
  readonly isUnauthenticated: boolean;
  /** True when this error type carries an authorization meaning. */
  readonly isForbidden: boolean;

  constructor(
    defaultCode: string,
    defaultClientMessage: string,
    options: AppErrorOptions = {},
    traits: Partial<{
      isOperational: boolean;
      isNotFound: boolean;
      isUnauthenticated: boolean;
      isForbidden: boolean;
    }> = {},
  ) {
    super(defaultClientMessage);
    this.name = new.target.name;
    this.code = resolveCode(defaultCode, options);
    this.status = statusForCode(this.code);
    this.details = sanitizeDetails(options.details);
    this.exposeMessage = options.exposeMessage ?? true;
    this.isOperational = traits.isOperational ?? true;
    this.isNotFound = traits.isNotFound ?? false;
    this.isUnauthenticated = traits.isUnauthenticated ?? false;
    this.isForbidden = traits.isForbidden ?? false;
    this.retryAfterSeconds = normalizeRetryAfter(options.retryAfterSeconds);
    this.internalMessage = resolveInternalMessage(
      options.internalMessage ?? options.message ?? defaultClientMessage,
    );
    if (options.cause !== undefined) {
      setCause(this, options.cause);
    }
    if (!this.exposeMessage) {
      this.message = defaultMessageForCode(this.code);
    }
  }

  /**
   * True when the catalogue marks this code retryable: rate limits, provider
   * failures, storage outages and timeouts. An internal defect returns false,
   * because repeating the same request would fail the same way.
   */
  get isRetryable(): boolean {
    return isRetryableCode(this.code);
  }

  /** True when the error means "no such record, or not yours". */
  get isNotFoundLike(): boolean {
    return this.isNotFound || this.status === 404;
  }

  /** True when the error means "not authenticated". */
  get isUnauthenticatedLike(): boolean {
    return this.isUnauthenticated || this.status === 401;
  }

  /** True when the error means "authenticated but not allowed". */
  get isForbiddenLike(): boolean {
    return this.isForbidden || this.status === 403;
  }

  /** Message that may be shown to a user. */
  get clientMessage(): string {
    return this.exposeMessage ? this.message : defaultMessageForCode(this.code);
  }

  /** One line for the log: name, code, status and the internal message. */
  describe(): string {
    return `${this.name} ${this.code} (${this.status}): ${this.internalMessage}`;
  }
}

function resolveCode(defaultCode: string, options: AppErrorOptions): string {
  if (typeof options.code === 'string' && options.code.length > 0) {
    return options.code;
  }
  if (isResourceSlug(options.resource)) {
    return buildEntityCode(options.resource, options.codeSuffix ?? 'not_found');
  }
  return defaultCode;
}

function resolveInternalMessage(message: string): string {
  const normalized = message.replace(/\s+/g, ' ').trim();
  if (normalized.length <= MAX_INTERNAL_MESSAGE_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, MAX_INTERNAL_MESSAGE_LENGTH)}...`;
}

function normalizeRetryAfter(value: number | undefined): number | undefined {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.min(Math.ceil(value), 86_400);
}

function sanitizeDetails(details: readonly ErrorDetail[] | undefined): readonly ErrorDetail[] {
  if (details === undefined) {
    return [];
  }
  return details.slice(0, 50).map((detail) => ({
    ...(detail.path === undefined ? {} : { path: detail.path }),
    ...(detail.code === undefined ? {} : { code: detail.code }),
    message: normalizeDetailMessage(detail.message),
  }));
}

/** Attach a cause without depending on the Error options support level. */
export function setCause(error: AppError, cause: unknown): void {
  Object.defineProperty(error, 'cause', {
    value: cause,
    enumerable: false,
    writable: true,
    configurable: true,
  });
}

/** True when the value is an AppError (or a subclass). */
export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
