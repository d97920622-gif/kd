// path: lib/logger/serializer.ts
/**
 * Value serialization for log records.
 *
 * Log context accepts anything a caller passes: primitives, dates, errors,
 * maps, sets, promises, class instances and cyclic structures. This module
 * turns all of them into JSON-safe values with hard limits so a log call can
 * never blow up the process or write a megabyte line.
 *
 * Limits: nesting depth 6, 50 array and map entries, 100 object keys, 2000
 * characters per string. Every truncation is marked in the output, so a
 * reader can always tell that a value was cut short.
 */

const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 50;
const MAX_MAP_ENTRIES = 50;
const MAX_OBJECT_KEYS = 100;
const MAX_STRING_LENGTH = 2000;

export const TRUNCATED_MARKER = '[truncated]';
export const CIRCULAR_MARKER = '[circular]';

export interface SerializedError {
  readonly name: string;
  readonly message: string;
  readonly stack?: string;
  readonly code?: string;
}

/** Convert any thrown value into a stable, JSON-safe error shape. */
export function serializeError(error: unknown): SerializedError {
  if (!(error instanceof Error)) {
    return { name: 'NonError', message: truncateString(safeToString(error)) };
  }
  const code = readErrorCode(error);
  const result: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  } = {
    name: error.name,
    message: truncateString(error.message),
  };
  if (typeof error.stack === 'string' && error.stack.length > 0) {
    result.stack = truncateString(error.stack);
  }
  if (code !== undefined) {
    result.code = code;
  }
  return result;
}

/** Shrink a long string and mark the cut. */
export function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH)} ${TRUNCATED_MARKER}`;
}

function readErrorCode(error: Error): string | undefined {
  const candidate = (error as { code?: unknown }).code;
  return typeof candidate === 'string' ? candidate : undefined;
}

function safeToString(value: unknown): string {
  try {
    return String(value);
  } catch {
    return 'unserializable value';
  }
}

function serializeArray(
  value: readonly unknown[],
  depth: number,
  seen: WeakSet<object>,
): unknown[] {
  const items = value
    .slice(0, MAX_ARRAY_ITEMS)
    .map((item) => toSerializable(item, depth + 1, seen));
  if (value.length > MAX_ARRAY_ITEMS) {
    items.push(`${value.length - MAX_ARRAY_ITEMS} more items ${TRUNCATED_MARKER}`);
  }
  return items;
}

function serializeMap(value: Map<unknown, unknown>, depth: number, seen: WeakSet<object>): unknown {
  const entries: Record<string, unknown> = {};
  let count = 0;
  for (const [key, entryValue] of value.entries()) {
    if (count >= MAX_MAP_ENTRIES) {
      entries[TRUNCATED_MARKER] = `${value.size - count} more entries`;
      break;
    }
    entries[safeToString(key)] = toSerializable(entryValue, depth + 1, seen);
    count += 1;
  }
  return entries;
}

function serializeObject(value: object, depth: number, seen: WeakSet<object>): unknown {
  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, unknown> = {};
  for (const [key, entryValue] of entries.slice(0, MAX_OBJECT_KEYS)) {
    result[key] = toSerializable(entryValue, depth + 1, seen);
  }
  if (entries.length > MAX_OBJECT_KEYS) {
    result[TRUNCATED_MARKER] = `${entries.length - MAX_OBJECT_KEYS} more keys`;
  }
  return result;
}

/**
 * Convert a value into something JSON.stringify can always handle.
 * Cyclic references become CIRCULAR_MARKER, depth beyond MAX_DEPTH becomes
 * the truncated marker, and unsupported value kinds become short strings.
 */
export function toSerializable(
  value: unknown,
  depth = 0,
  seen: WeakSet<object> = new WeakSet<object>(),
): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  const kind = typeof value;
  if (kind === 'string') {
    return truncateString(value as string);
  }
  if (kind === 'number' || kind === 'boolean') {
    return value;
  }
  if (kind === 'bigint') {
    return `${safeToString(value)}n`;
  }
  if (kind === 'function' || kind === 'symbol') {
    return `[${kind}]`;
  }
  if (depth >= MAX_DEPTH) {
    return TRUNCATED_MARKER;
  }
  const objectValue = value as object;
  if (seen.has(objectValue)) {
    return CIRCULAR_MARKER;
  }
  seen.add(objectValue);
  try {
    if (objectValue instanceof Date) {
      return objectValue.toISOString();
    }
    if (objectValue instanceof Error) {
      return serializeError(objectValue);
    }
    if (Array.isArray(objectValue)) {
      return serializeArray(objectValue, depth, seen);
    }
    if (objectValue instanceof Map) {
      return serializeMap(objectValue, depth, seen);
    }
    if (objectValue instanceof Set) {
      return serializeArray([...objectValue], depth, seen);
    }
    return serializeObject(objectValue, depth, seen);
  } finally {
    seen.delete(objectValue);
  }
}
