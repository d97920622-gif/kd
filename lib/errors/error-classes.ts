// path: lib/errors/error-classes.ts
/**
 * The typed error classes of the platform.
 *
 * One class per error family, one code per class, no duplicates anywhere.
 * The classes are raised by services and route handlers; the envelope
 * builder in ./envelope.ts turns them into responses.
 *
 * Every class accepts a resource slug so the class covers the whole domain
 * without a new class per entity:
 *   new NotFoundError('invoice')  -> code invoice_not_found, status 404
 *   new DuplicateError('client')  -> code client_duplicate, status 409
 */
import { AppError, type AppErrorOptions } from './app-error.ts';
import { DEFAULT_CODE_BY_ERROR_TYPE, isResourceSlug } from './error-codes.ts';

import type { ErrorDetail } from './error-detail.ts';

export interface EntityErrorOptions extends Omit<AppErrorOptions, 'codeSuffix'> {
  /** Entity the error is about, for example invoice or payment_method. */
  readonly resource?: string;
}

/** Turn a resource slug into a readable label: payment_method -> payment method. */
export function humanizeResource(resource: string): string {
  return resource.replace(/_/g, ' ');
}

/** Capitalized form of a resource label, for the start of a message. */
export function labelForResource(resource: string | undefined, fallback: string): string {
  if (!isResourceSlug(resource)) {
    return fallback;
  }
  const words = humanizeResource(resource);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

/** 400: the submitted data failed validation. */
export class ValidationError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.validation, 'The submitted data is not valid.', options);
  }

  /** Build a validation error from field-level details. */
  static fromDetails(
    details: readonly ErrorDetail[],
    options: AppErrorOptions = {},
  ): ValidationError {
    return new ValidationError({ ...options, details });
  }
}

/** 401: authentication is required or the credential was rejected. */
export class UnauthorizedError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.unauthenticated, 'Authentication is required.', options, {
      isUnauthenticated: true,
    });
  }
}

/** 403: authenticated but not permitted. */
export class ForbiddenError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.forbidden, 'You do not have permission to do this.', options, {
      isForbidden: true,
    });
  }
}

/**
 * 404: the record does not exist or does not belong to this tenant.
 * Cross-tenant access always answers with this error, never with 403.
 */
export class NotFoundError extends AppError {
  constructor(options: EntityErrorOptions = {}) {
    const label = labelForResource(options.resource, 'The requested record').toLowerCase();
    super(DEFAULT_CODE_BY_ERROR_TYPE.notFound, `The requested ${label} was not found.`, options, {
      isNotFound: true,
    });
  }
}

/** 409: the record changed under an optimistic lock, or state forbids the action. */
export class ConflictError extends AppError {
  constructor(options: EntityErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.conflict, 'The record changed while you were editing it.', {
      ...options,
      codeSuffix: 'conflict',
    });
  }
}

/** 409: an equivalent record already exists. */
export class DuplicateError extends AppError {
  constructor(options: EntityErrorOptions = {}) {
    const label = labelForResource(options.resource, 'record').toLowerCase();
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.duplicate,
      `A ${label} with the same details already exists.`,
      { ...options, codeSuffix: 'duplicate' },
    );
  }
}

/** 409: the same idempotency key was reused with a different payload. */
export class IdempotencyConflictError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.idempotencyConflict,
      'This request was already submitted with different data.',
      options,
    );
  }
}

/** 412: a required precondition was not met. */
export class PreconditionFailedError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.preconditionFailed,
      'A required condition was not met.',
      options,
    );
  }
}

/** 423: the record or the account is temporarily locked. */
export class LockedError extends AppError {
  constructor(options: EntityErrorOptions = {}) {
    const label = labelForResource(options.resource, 'This');
    super(DEFAULT_CODE_BY_ERROR_TYPE.locked, `${label} is temporarily locked.`, {
      ...options,
      codeSuffix: 'locked',
    });
  }
}

/** 429: the caller exceeded a rate limit. Always carries a retry hint. */
export class RateLimitError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.rateLimit, 'Too many requests. Please wait and try again.', {
      retryAfterSeconds: 60,
      ...options,
    });
  }
}

/** 502: an upstream payment provider did not complete the request. */
export class GatewayError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.gateway,
      'The payment provider did not complete the request. Please try again.',
      { retryAfterSeconds: 30, ...options },
    );
  }
}

/** 503: file storage is unavailable. */
export class StorageError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.storage,
      'File storage is temporarily unavailable. Please try again.',
      { retryAfterSeconds: 60, ...options },
    );
  }
}

/** 403: a compliance policy blocks the action. Always audited when raised. */
export class ComplianceError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.compliance,
      'This action is not allowed by the compliance policy.',
      options,
    );
  }
}

/** 504: an operation exceeded its time budget. */
export class TimeoutError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(DEFAULT_CODE_BY_ERROR_TYPE.timeout, 'The operation took too long. Please try again.', {
      retryAfterSeconds: 10,
      ...options,
    });
  }
}

/** 405: the route exists but does not support this operation. */
export class MethodNotAllowedError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.methodNotAllowed,
      'This operation is not supported for this resource.',
      options,
    );
  }
}

/** 413: the payload exceeds the configured limit. */
export class PayloadTooLargeError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.payloadTooLarge,
      'The submitted payload is too large.',
      options,
    );
  }
}

/** 415: the content type is not supported for this endpoint. */
export class UnsupportedMediaTypeError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.unsupportedMediaType,
      'The submitted content type is not supported.',
      options,
    );
  }
}

/** 401: a webhook signature failed verification. Never processed further. */
export class WebhookSignatureError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.webhookSignatureInvalid,
      'The webhook signature is not valid.',
      options,
    );
  }
}

/** 500: the service configuration is incomplete or contradictory. */
export class ConfigurationError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.configuration,
      'The service is not configured correctly.',
      options,
    );
  }
}

/**
 * 500: an unexpected condition. The message is never exposed, because it may
 * contain internal text, and the error is not operational: it is a defect
 * that must be investigated, not a condition the caller can fix.
 */
export class InternalError extends AppError {
  constructor(options: AppErrorOptions = {}) {
    super(
      DEFAULT_CODE_BY_ERROR_TYPE.internal,
      'An unexpected error occurred. Please try again.',
      { ...options, exposeMessage: false },
      { isOperational: false },
    );
  }
}
