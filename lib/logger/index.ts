// path: lib/logger/index.ts
/**
 * Public surface of the structured logger.
 *
 * Import from here in application code:
 *   import { logger, withCorrelationId } from '@/lib/logger';
 *
 * Server side only: correlation propagation uses AsyncLocalStorage, so
 * browser code must not import this barrel. Client code reports through a
 * server route, and a browser transport registers through addTransport.
 */
export {
  addTransport,
  createLogger,
  DEFAULT_SERVICE_NAME,
  getRecentRecords,
  logger,
  registerLogSecret,
  registerLogSecrets,
  resolveLevelThreshold,
  setLogLevelOverride,
} from './structured-logger';

export type {
  Logger,
  LoggerOptions,
  LogContext,
  LogRecord,
  LogTransport,
} from './structured-logger';

export {
  clearSecretValues,
  getSecretValueCount,
  isSensitiveKey,
  REDACTION_PLACEHOLDER,
  redactContext,
  redactText,
  redactValue,
  registerRedactionHook,
  registerSecretValue,
  registerSecretValues,
} from './redaction';

export type { RedactionHook } from './redaction';

export {
  CORRELATION_ID_HEADER,
  getCorrelationId,
  isCorrelationId,
  newCorrelationId,
  normalizeCorrelationId,
  SYSTEM_CORRELATION_ID,
  withCorrelationId,
  withNewCorrelationId,
} from './correlation';

export {
  DEFAULT_LOG_LEVEL,
  isLevelEnabled,
  isLogLevel,
  LOG_LEVELS,
  parseLogLevel,
  severityOf,
} from './levels';

export type { LogLevel } from './levels';

export { CIRCULAR_MARKER, serializeError, toSerializable, TRUNCATED_MARKER } from './serializer';

export type { SerializedError } from './serializer';
