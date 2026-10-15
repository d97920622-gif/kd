// path: lib/errors/index.ts
/**
 * Public surface of the error library.
 *
 * Import from here in application code:
 *   import { NotFoundError, failureResponse } from '@/lib/errors';
 *
 * Server side only: the envelope builder reads the correlation context, which
 * uses AsyncLocalStorage. Client code shows the message returned by the
 * server; it never constructs these errors.
 */
export {
  AppError,
  isAppError,
  MAX_INTERNAL_MESSAGE_LENGTH,
  normalizeDetailMessage,
} from './app-error';

export type { AppErrorOptions } from './app-error';

export { fieldDetail, ruleDetail } from './error-detail';

export type { ErrorDetail } from './error-detail';

export {
  buildEntityCode,
  DEFAULT_CODE_BY_ERROR_TYPE,
  definitionForCode,
  defaultMessageForCode,
  ERROR_CODES,
  isKnownErrorCode,
  isResourceSlug,
  isRetryableCode,
  RESOURCE_SLUG_PATTERN,
  statusForCode,
} from './error-codes';

export type { ErrorCode, ErrorCodeDefinition, ErrorCodeSuffix } from './error-codes';

export {
  ComplianceError,
  ConfigurationError,
  ConflictError,
  DuplicateError,
  ForbiddenError,
  GatewayError,
  humanizeResource,
  IdempotencyConflictError,
  InternalError,
  labelForResource,
  LockedError,
  MethodNotAllowedError,
  NotFoundError,
  PayloadTooLargeError,
  PreconditionFailedError,
  RateLimitError,
  StorageError,
  TimeoutError,
  UnauthorizedError,
  UnsupportedMediaTypeError,
  ValidationError,
  WebhookSignatureError,
} from './error-classes';

export type { EntityErrorOptions } from './error-classes';

export {
  envelopeHeaders,
  failureEnvelope,
  failureResponse,
  successEnvelope,
  successResponse,
} from './envelope';

export type { FailureEnvelope, PageMeta, SuccessEnvelope, SuccessMeta } from './envelope';

export {
  describeValue,
  detailsFromZodError,
  isDatabaseError,
  normalizeError,
} from './normalize-error';

export { internalErrorFrom, isErrorLogged, logAppError, logServerFault } from './error-logger';

export type { LogErrorOptions } from './error-logger';
