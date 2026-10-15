// path: lib/errors/error-logger.ts
/**
 * The logging half of the error contract.
 *
 * A typed error carries two messages: a safe one for the caller and an
 * internal one for the log. This module writes the internal half through the
 * structured logger (lib/logger, sub-step 1.8), which redacts secrets and
 * PII before the record is written, and returns the normalized error so a
 * caller can chain:
 *
 *   catch (error) {
 *     const typed = logAppError(error, { operation: 'invoice.create' });
 *     return failureResponse(typed);
 *   }
 *
 * Level policy: 5xx and non-operational errors are logged at error level
 * because they need attention; 4xx conditions are logged at warn level
 * because they are expected traffic, not incidents.
 */
import { createLogger, type Logger, type LogContext } from '../logger/structured-logger';

import { type AppError } from './app-error';
import { InternalError } from './error-classes';
import { describeValue, normalizeError } from './normalize-error';

const errorLogger: Logger = createLogger({ service: 'error' });

/**
 * Errors already written to the log. A caller may log an error and then build
 * a response; the response builder logs only what nobody has logged yet, so
 * an incident is never reported twice and never lost.
 */
const loggedErrors = new WeakSet<AppError>();

/** True when this exact error instance has already been logged. */
export function isErrorLogged(error: AppError): boolean {
  return loggedErrors.has(error);
}

export interface LogErrorOptions {
  /** Logger to use; defaults to the shared error logger. */
  readonly logger?: Logger;
  /** Stable operation name, for example payment.capture. */
  readonly operation?: string;
  /** Extra context for the log record. Redacted by the logger. */
  readonly context?: LogContext;
}

const STACK_LINE_LIMIT = 20;

function stackSummary(error: AppError): string | undefined {
  const stack = error.stack;
  if (typeof stack !== 'string' || stack.length === 0 || error.isOperational) {
    return undefined;
  }
  return stack.split('\n').slice(0, STACK_LINE_LIMIT).join('\n');
}

/**
 * Normalize and log a thrown value. Returns the AppError so the caller can
 * build a response from it.
 */
export function logAppError(error: unknown, options: LogErrorOptions = {}): AppError {
  const target = options.logger ?? errorLogger;
  const normalized = normalizeError(error);
  const context: LogContext = {
    code: normalized.code,
    status: normalized.status,
    retryable: normalized.isRetryable,
    internal_message: normalized.internalMessage,
    ...(options.operation === undefined ? {} : { operation: options.operation }),
    ...(normalized.cause === undefined ? {} : { cause_type: describeValue(normalized.cause) }),
  };
  const stack = stackSummary(normalized);
  if (stack !== undefined) {
    context.stack = stack;
  }
  if (Object.keys(options.context ?? {}).length > 0) {
    context.extra = options.context;
  }
  const payload: LogContext = { ...context };
  if (!normalized.isOperational || normalized.status >= 500) {
    target.error(normalized.describe(), payload);
  } else {
    target.warn(normalized.describe(), payload);
  }
  loggedErrors.add(normalized);
  return normalized;
}

/**
 * Log a server-side fault if nobody has logged it yet. Expected client
 * conditions (4xx from an operational error) are not auto-logged: a caller
 * logs those with operation context when it needs the trail.
 */
export function logServerFault(error: AppError, options: LogErrorOptions = {}): AppError {
  if (isErrorLogged(error)) {
    return error;
  }
  if (error.status < 500 && error.isOperational) {
    return error;
  }
  return logAppError(error, options);
}

/** Wrap an unexpected value as a non-operational InternalError. */
export function internalErrorFrom(value: unknown, internalMessage: string): InternalError {
  return new InternalError({ internalMessage, cause: value });
}
