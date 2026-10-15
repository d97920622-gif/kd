// path: lib/logger/structured-logger.ts
/**
 * Structured logger for KD SOLUTION IT (server side).
 *
 * Contract:
 *   - One JSON object per line: standard output for debug and info, standard
 *     error for warn and error. Never the console object, never multi-line.
 *   - Fixed top-level fields: level, time, message, correlation_id, service,
 *     context. Call values always live under context, so no caller value can
 *     overwrite a reserved field.
 *   - The correlation id comes from the async context (see ./correlation);
 *     outside a context it is the literal "system".
 *   - Every record is serialized and redacted before it is written, stored
 *     in the recent-record buffer or handed to a transport.
 *   - Logging never throws: transport and hook failures are contained and
 *     reported as a single diagnostic record.
 *
 * Level threshold: the override set here, otherwise the LOG_LEVEL
 * environment variable, otherwise info.
 *
 * This module is server side because correlation propagation uses
 * AsyncLocalStorage. Browser code reports through a server route; a browser
 * transport registers through addTransport (append point for later steps).
 */
import { getCorrelationId } from './correlation';
import { isLevelEnabled, type LogLevel, parseLogLevel } from './levels';
import { redactContext, registerSecretValue, registerSecretValues } from './redaction';
import { toSerializable } from './serializer';

export const DEFAULT_SERVICE_NAME = 'kd-solution-it';

const RECENT_RECORD_LIMIT = 200;

export type LogContext = Record<string, unknown>;

export interface LogRecord {
  readonly level: LogLevel;
  readonly time: string;
  readonly message: string;
  readonly correlation_id: string;
  readonly service: string;
  readonly context: Record<string, unknown>;
}

export interface LogTransport {
  readonly name: string;
  write(record: LogRecord): void;
}

export interface LoggerOptions {
  readonly service?: string;
  readonly context?: LogContext;
  readonly level?: LogLevel;
}

export interface Logger {
  readonly service: string;
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
}

const transports: LogTransport[] = [];
const recentRecords: LogRecord[] = [];
let levelOverride: LogLevel | undefined;

/** Register a transport. Returns a function that removes it again. */
export function addTransport(transport: LogTransport): () => void {
  transports.push(transport);
  return () => {
    const index = transports.indexOf(transport);
    if (index >= 0) {
      transports.splice(index, 1);
    }
  };
}

/** Effective threshold: override, then LOG_LEVEL, then info. */
export function resolveLevelThreshold(): LogLevel {
  return levelOverride ?? parseLogLevel(process.env.LOG_LEVEL);
}

/** Set or clear the process level override. */
export function setLogLevelOverride(level: LogLevel | undefined): void {
  levelOverride = level;
}

/** Register a secret value so it is replaced in every future record. */
export function registerLogSecret(value: string): void {
  registerSecretValue(value);
}

/** Register several secret values, for example the boot-time environment. */
export function registerLogSecrets(values: readonly string[]): void {
  registerSecretValues(values);
}

/** Copy of the most recent records, newest last, for diagnostics. */
export function getRecentRecords(limit = 50): LogRecord[] {
  const count = Math.min(Math.max(limit, 0), recentRecords.length);
  return recentRecords.slice(recentRecords.length - count);
}

function rememberRecord(record: LogRecord): void {
  recentRecords.push(record);
  if (recentRecords.length > RECENT_RECORD_LIMIT) {
    recentRecords.shift();
  }
}

function writeToStandardStreams(record: LogRecord): void {
  const line = `${JSON.stringify(record)}\n`;
  const stream =
    record.level === 'warn' || record.level === 'error' ? process.stderr : process.stdout;
  if (stream !== undefined && typeof stream.write === 'function') {
    stream.write(line);
  }
}

function dispatch(record: LogRecord): void {
  writeToStandardStreams(record);
  for (const transport of transports) {
    try {
      transport.write(record);
    } catch {
      writeToStandardStreams({
        level: 'warn',
        time: new Date().toISOString(),
        message: 'log transport failed',
        correlation_id: record.correlation_id,
        service: record.service,
        context: { transport: transport.name },
      });
    }
  }
}

function emit(
  service: string,
  bound: LogContext,
  level: LogLevel,
  message: string,
  context?: LogContext,
): void {
  if (!isLevelEnabled(level, resolveLevelThreshold())) {
    return;
  }
  const merged: Record<string, unknown> = { ...bound, ...context };
  const serialized = toSerializable(merged) as Record<string, unknown>;
  const record: LogRecord = {
    level,
    time: new Date().toISOString(),
    message,
    correlation_id: getCorrelationId(),
    service,
    context: redactContext(serialized),
  };
  try {
    rememberRecord(record);
    dispatch(record);
  } catch {
    writeToStandardStreams(record);
  }
}

/** Create a logger with its own service name and bound context. */
export function createLogger(options: LoggerOptions = {}): Logger {
  const service = options.service ?? DEFAULT_SERVICE_NAME;
  const bound: LogContext = { ...options.context };
  if (options.level !== undefined) {
    levelOverride = options.level;
  }
  return {
    service,
    debug: (message, context) => emit(service, bound, 'debug', message, context),
    info: (message, context) => emit(service, bound, 'info', message, context),
    warn: (message, context) => emit(service, bound, 'warn', message, context),
    error: (message, context) => emit(service, bound, 'error', message, context),
    child: (context) => createLogger({ service, context: { ...bound, ...context } }),
  };
}

/** Shared application logger. */
export const logger: Logger = createLogger();

export { getCorrelationId } from './correlation';
export type { LogLevel } from './levels';
