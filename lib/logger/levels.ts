// path: lib/logger/levels.ts
/**
 * Log level vocabulary and threshold arithmetic for the structured logger.
 *
 * Levels and their severity: debug 10, info 20, warn 30, error 40. A record
 * is emitted when its severity is greater than or equal to the threshold.
 *
 * Threshold source order: the process override set by setLogLevelOverride,
 * then the LOG_LEVEL environment variable, then the info default. The
 * environment schema in lib/env/validate-env.ts rejects an invalid LOG_LEVEL
 * at boot; this module additionally falls back to info instead of throwing,
 * because a logger that throws is worse than a logger with a default level.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

export const DEFAULT_LOG_LEVEL: LogLevel = 'info';

const SEVERITY: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** True when the value is one of the four supported level names. */
export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value);
}

/** Map an environment string to a level; unknown or missing values give info. */
export function parseLogLevel(value: string | undefined): LogLevel {
  const candidate = (value ?? '').trim().toLowerCase();
  return isLogLevel(candidate) ? candidate : DEFAULT_LOG_LEVEL;
}

/** Numeric severity of a level, used for threshold comparison. */
export function severityOf(level: LogLevel): number {
  return SEVERITY[level];
}

/** True when a record of this level passes the threshold. */
export function isLevelEnabled(level: LogLevel, threshold: LogLevel): boolean {
  return severityOf(level) >= severityOf(threshold);
}
