// path: lib/errors/error-codes.ts
/**
 * The error code catalogue.
 *
 * Every error the platform can produce or return has exactly one code here.
 * A code carries three things: the HTTP status it maps to, the English
 * message a user may see, and whether the caller may retry the operation.
 *
 * Codes are stable public identifiers: they appear in the failure envelope,
 * in the API documentation and in support tickets. They are never renamed;
 * a new behaviour gets a new code.
 *
 * Entity-specific codes follow the pattern {resource}_{suffix}, for example
 * invoice_not_found or payment_conflict. Later steps add codes by appending
 * entries to the record below through the append protocol (03_FILE_OWNERSHIP_MATRIX.md
 * section 3): add a new entry, never edit or remove an existing one.
 */

export interface ErrorCodeDefinition {
  /** HTTP status returned for this code. */
  readonly status: number;
  /** English message shown to a user when a class does not override it. */
  readonly message: string;
  /** True when the same request may succeed if it is retried later. */
  readonly retryable: boolean;
}

export const ERROR_CODES = {
  validation_failed: {
    status: 400,
    message: 'The submitted data is not valid.',
    retryable: false,
  },
  unauthenticated: {
    status: 401,
    message: 'Authentication is required.',
    retryable: false,
  },
  forbidden: {
    status: 403,
    message: 'You do not have permission to do this.',
    retryable: false,
  },
  not_found: {
    status: 404,
    message: 'The requested record was not found.',
    retryable: false,
  },
  method_not_allowed: {
    status: 405,
    message: 'This operation is not supported for this resource.',
    retryable: false,
  },
  conflict: {
    status: 409,
    message: 'The record changed while you were editing it.',
    retryable: false,
  },
  duplicate: {
    status: 409,
    message: 'A record with these details already exists.',
    retryable: false,
  },
  idempotency_conflict: {
    status: 409,
    message: 'This request was already submitted with different data.',
    retryable: false,
  },
  precondition_failed: {
    status: 412,
    message: 'A required condition was not met.',
    retryable: false,
  },
  payload_too_large: {
    status: 413,
    message: 'The submitted payload is too large.',
    retryable: false,
  },
  unsupported_media_type: {
    status: 415,
    message: 'The submitted content type is not supported.',
    retryable: false,
  },
  locked: {
    status: 423,
    message: 'This action is temporarily locked.',
    retryable: false,
  },
  rate_limited: {
    status: 429,
    message: 'Too many requests. Please wait and try again.',
    retryable: true,
  },
  internal_error: {
    status: 500,
    message: 'An unexpected error occurred. Please try again.',
    retryable: false,
  },
  configuration_error: {
    status: 500,
    message: 'The service is not configured correctly.',
    retryable: false,
  },
  env_validation_failed: {
    status: 500,
    message: 'The service configuration is incomplete.',
    retryable: false,
  },
  gateway_error: {
    status: 502,
    message: 'The payment provider did not complete the request. Please try again.',
    retryable: true,
  },
  webhook_signature_invalid: {
    status: 401,
    message: 'The webhook signature is not valid.',
    retryable: false,
  },
  storage_error: {
    status: 503,
    message: 'File storage is temporarily unavailable. Please try again.',
    retryable: true,
  },
  timeout: {
    status: 504,
    message: 'The operation took too long. Please try again.',
    retryable: true,
  },
  compliance_error: {
    status: 403,
    message: 'This action is not allowed by the compliance policy.',
    retryable: false,
  },
} as const satisfies Record<string, ErrorCodeDefinition>;

/** Every base code known to the platform. */
export type ErrorCode = keyof typeof ERROR_CODES;

/** Default codes used when a class does not supply a specific one. */
export const DEFAULT_CODE_BY_ERROR_TYPE = {
  validation: 'validation_failed',
  unauthenticated: 'unauthenticated',
  forbidden: 'forbidden',
  notFound: 'not_found',
  conflict: 'conflict',
  duplicate: 'duplicate',
  rateLimit: 'rate_limited',
  locked: 'locked',
  gateway: 'gateway_error',
  storage: 'storage_error',
  compliance: 'compliance_error',
  internal: 'internal_error',
  configuration: 'configuration_error',
  timeout: 'timeout',
  methodNotAllowed: 'method_not_allowed',
  payloadTooLarge: 'payload_too_large',
  unsupportedMediaType: 'unsupported_media_type',
  preconditionFailed: 'precondition_failed',
  idempotencyConflict: 'idempotency_conflict',
  webhookSignatureInvalid: 'webhook_signature_invalid',
} as const satisfies Record<string, ErrorCode>;

/** Suffixes used to build entity-specific codes, for example invoice_not_found. */
export type ErrorCodeSuffix =
  | 'not_found'
  | 'conflict'
  | 'duplicate'
  | 'locked'
  | 'invalid'
  | 'expired'
  | 'rejected'
  | 'not_allowed';

/** A resource slug: lower case snake case, for example payment_method. */
export const RESOURCE_SLUG_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

const MAX_RESOURCE_SLUG_LENGTH = 40;

/** True when the value is a usable resource slug. */
export function isResourceSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= MAX_RESOURCE_SLUG_LENGTH &&
    RESOURCE_SLUG_PATTERN.test(value)
  );
}

/** Entity-specific code, for example buildEntityCode('invoice', 'not_found'). */
export function buildEntityCode(resource: string, suffix: ErrorCodeSuffix): string {
  if (!isResourceSlug(resource)) {
    return suffix;
  }
  return `${resource}_${suffix}`;
}

/** True when the code is one of the base catalogue codes. */
export function isKnownErrorCode(code: string): code is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_CODES, code);
}

/**
 * Status and retry policy for any code.
 *
 * A base code resolves from the catalogue. An entity-specific code such as
 * invoice_not_found resolves from its suffix, so a new entity does not need a
 * new catalogue entry to get the correct status.
 */
export function definitionForCode(code: string): ErrorCodeDefinition {
  if (isKnownErrorCode(code)) {
    return ERROR_CODES[code];
  }
  const suffixes: readonly ErrorCodeSuffix[] = [
    'not_found',
    'conflict',
    'duplicate',
    'locked',
    'invalid',
    'expired',
    'rejected',
    'not_allowed',
  ];
  for (const suffix of suffixes) {
    if (code.endsWith(`_${suffix}`)) {
      const base: ErrorCode =
        suffix === 'invalid'
          ? 'validation_failed'
          : suffix === 'expired'
            ? 'forbidden'
            : suffix === 'rejected'
              ? 'forbidden'
              : suffix === 'not_allowed'
                ? 'forbidden'
                : suffix;
      return ERROR_CODES[base];
    }
  }
  return ERROR_CODES.internal_error;
}

/** HTTP status for a code. */
export function statusForCode(code: string): number {
  return definitionForCode(code).status;
}

/** Default English message for a code. */
export function defaultMessageForCode(code: string): string {
  return definitionForCode(code).message;
}

/** True when a request with this code may be retried later. */
export function isRetryableCode(code: string): boolean {
  return definitionForCode(code).retryable;
}
