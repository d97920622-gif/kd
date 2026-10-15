// path: lib/utils/date.ts
/**
 * UTC date and time utilities.
 *
 * Every timestamp in the platform is UTC (TIMESTAMPTZ, no local time). This
 * module is the single place where dates are created, shifted, compared and
 * formatted, so nothing else may call the local-time parts of the Date API
 * (getHours, getDate, setHours and similar) or format a date implicitly.
 *
 * Design choices:
 *   - Formatting is deterministic and independent of the runtime locale and
 *     the ICU build: month names are constants and the field order is fixed.
 *     The same instant therefore renders identically on the server, in a
 *     build job and in any browser.
 *   - Parsing is strict: only ISO 8601 date and date-time strings are
 *     accepted, and an unparseable value returns null instead of an Invalid
 *     Date object.
 *   - Shifting uses integer millisecond arithmetic on UTC fields only, so a
 *     daylight saving transition can never move a stored timestamp.
 *
 * This module is safe for server and browser use: it imports nothing.
 */

/** Milliseconds in one second. */
export const SECOND_MS = 1000;
/** Milliseconds in one minute. */
export const MINUTE_MS = 60 * SECOND_MS;
/** Milliseconds in one hour. */
export const HOUR_MS = 60 * MINUTE_MS;
/** Milliseconds in one day, as an exact UTC duration. */
export const DAY_MS = 24 * HOUR_MS;

export type DateInput = Date | string | number;

export type DateStyle = 'long' | 'short';

const MONTH_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const WEEKDAY_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:?\d{2})?$/;

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

/** Current instant. */
export function utcNow(): Date {
  return new Date();
}

/** Current instant as an ISO 8601 string with milliseconds. */
export function utcNowIso(): string {
  return new Date().toISOString();
}

/** True when the value is a Date holding a valid instant. */
export function isValidDate(value: unknown): boolean {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Convert an accepted input into a Date, or null when it is not a valid instant. */
export function toDate(value: DateInput | null | undefined): Date | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return isValidDate(value) ? new Date(value.getTime()) : null;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null;
    }
    const fromNumber = new Date(value);
    return isValidDate(fromNumber) ? fromNumber : null;
  }
  const trimmed = value.trim();
  if (!ISO_DATE_TIME_PATTERN.test(trimmed) && !ISO_DATE_PATTERN.test(trimmed)) {
    return null;
  }
  const parsed = new Date(trimmed);
  return isValidDate(parsed) ? parsed : null;
}

/** True when the text is an ISO 8601 date (2026-10-16) or date-time. */
export function isIsoDateString(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (ISO_DATE_PATTERN.test(value.trim()) || ISO_DATE_TIME_PATTERN.test(value.trim()))
  );
}

/** ISO 8601 string with milliseconds in UTC, or null when the input is invalid. */
export function toIsoString(value: DateInput | null | undefined): string | null {
  const date = toDate(value);
  return date === null ? null : date.toISOString();
}

/** Date-only string in UTC: 2026-10-16. */
export function toDateOnlyString(value: DateInput): string {
  const date = requireDate(value);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** Month key in UTC: 2026-10. Useful for period grouping. */
export function toMonthKey(value: DateInput): string {
  const date = requireDate(value);
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}`;
}

/** Time of day in UTC, 24 hour clock with seconds: 14:05:09. */
export function toTimeString(value: DateInput): string {
  const date = requireDate(value);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

/** Compact sortable stamp in UTC: 20261016T140509. */
export function toStampString(value: DateInput): string {
  const date = requireDate(value);
  return `${toDateOnlyString(date).replace(/-/g, '')}T${toTimeString(date).replace(/:/g, '')}`;
}

function requireDate(value: DateInput): Date {
  const date = toDate(value);
  if (date === null) {
    throw new RangeError('The value is not a valid date.');
  }
  return date;
}

/** Shift by a number of days, keeping the UTC instant exact. */
export function addDays(value: DateInput, days: number): Date {
  return new Date(requireDate(value).getTime() + days * DAY_MS);
}

/** Shift by a number of hours. */
export function addHours(value: DateInput, hours: number): Date {
  return new Date(requireDate(value).getTime() + hours * HOUR_MS);
}

/** Shift by a number of minutes. */
export function addMinutes(value: DateInput, minutes: number): Date {
  return new Date(requireDate(value).getTime() + minutes * MINUTE_MS);
}

/** Shift by a number of seconds. */
export function addSeconds(value: DateInput, seconds: number): Date {
  return new Date(requireDate(value).getTime() + seconds * SECOND_MS);
}

/** Shift by whole calendar months in UTC, clamping the day to the month end. */
export function addMonths(value: DateInput, months: number): Date {
  const date = requireDate(value);
  const targetMonth = date.getUTCMonth() + months;
  const year = date.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = daysInUtcMonth(year, month);
  const day = Math.min(date.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(
      year,
      month,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

/** Number of days in a UTC month. Month is zero based. */
export function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** First instant of the UTC day containing the value. */
export function startOfUtcDay(value: DateInput): Date {
  const date = requireDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Last millisecond of the UTC day containing the value. */
export function endOfUtcDay(value: DateInput): Date {
  return new Date(startOfUtcDay(value).getTime() + DAY_MS - 1);
}

/** First instant of the UTC month containing the value. */
export function startOfUtcMonth(value: DateInput): Date {
  const date = requireDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Last millisecond of the UTC month containing the value. */
export function endOfUtcMonth(value: DateInput): Date {
  const date = requireDate(value);
  const lastDay = daysInUtcMonth(date.getUTCFullYear(), date.getUTCMonth());
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), lastDay, 23, 59, 59, 999));
}

/** True when the first instant is before the second. */
export function isBefore(a: DateInput, b: DateInput): boolean {
  return requireDate(a).getTime() < requireDate(b).getTime();
}

/** True when the first instant is after the second. */
export function isAfter(a: DateInput, b: DateInput): boolean {
  return requireDate(a).getTime() > requireDate(b).getTime();
}

/** True when both values fall on the same UTC calendar day. */
export function isSameUtcDay(a: DateInput, b: DateInput): boolean {
  return startOfUtcDay(a).getTime() === startOfUtcDay(b).getTime();
}

/** True when the instant is in the future relative to now. */
export function isFuture(value: DateInput, now: DateInput = utcNow()): boolean {
  return requireDate(value).getTime() > requireDate(now).getTime();
}

/** True when the instant is in the past relative to now. */
export function isPast(value: DateInput, now: DateInput = utcNow()): boolean {
  return requireDate(value).getTime() < requireDate(now).getTime();
}

/** Whole days from a to b. Negative when b is earlier. */
export function differenceInDays(a: DateInput, b: DateInput): number {
  return Math.trunc((requireDate(b).getTime() - requireDate(a).getTime()) / DAY_MS);
}

/** Whole hours from a to b. Negative when b is earlier. */
export function differenceInHours(a: DateInput, b: DateInput): number {
  return Math.trunc((requireDate(b).getTime() - requireDate(a).getTime()) / HOUR_MS);
}

/** Whole minutes from a to b. Negative when b is earlier. */
export function differenceInMinutes(a: DateInput, b: DateInput): number {
  return Math.trunc((requireDate(b).getTime() - requireDate(a).getTime()) / MINUTE_MS);
}

/** Whole seconds from a to b. Negative when b is earlier. */
export function differenceInSeconds(a: DateInput, b: DateInput): number {
  return Math.trunc((requireDate(b).getTime() - requireDate(a).getTime()) / SECOND_MS);
}

/** Readable date in UTC: October 16, 2026 or Oct 16, 2026. */
export function formatUtcDate(value: DateInput, style: DateStyle = 'long'): string {
  const date = requireDate(value);
  const month = style === 'long' ? MONTH_LONG[date.getUTCMonth()] : MONTH_SHORT[date.getUTCMonth()];
  return `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Readable date and time in UTC: October 16, 2026 at 14:05 UTC. */
export function formatUtcDateTime(value: DateInput, style: DateStyle = 'long'): string {
  const date = requireDate(value);
  return `${formatUtcDate(date, style)} at ${formatUtcTime(date)}`;
}

/** Time in UTC: 14:05 UTC, or 2:05 PM UTC when hour12 is requested. */
export function formatUtcTime(
  value: DateInput,
  options: { readonly hour12?: boolean } = {},
): string {
  const date = requireDate(value);
  const minutes = pad(date.getUTCMinutes());
  if (options.hour12 !== true) {
    return `${pad(date.getUTCHours())}:${minutes} UTC`;
  }
  const hours24 = date.getUTCHours();
  const suffix = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${suffix} UTC`;
}

/** Weekday name in UTC. */
export function formatUtcWeekday(value: DateInput): string {
  return WEEKDAY_LONG[requireDate(value).getUTCDay()];
}

/** Relative description against now: in 3 days, 2 hours ago, just now. */
export function formatRelative(value: DateInput, now: DateInput = utcNow()): string {
  const target = requireDate(value).getTime();
  const reference = requireDate(now).getTime();
  const deltaSeconds = Math.trunc((target - reference) / SECOND_MS);
  const future = deltaSeconds > 0;
  const magnitude = Math.abs(deltaSeconds);
  if (magnitude < 45) {
    return 'just now';
  }
  const units: ReadonlyArray<readonly [number, string]> = [
    [31_536_000, 'year'],
    [2_592_000, 'month'],
    [604_800, 'week'],
    [86_400, 'day'],
    [3_600, 'hour'],
    [60, 'minute'],
  ];
  for (const [seconds, name] of units) {
    if (magnitude >= seconds) {
      const count = Math.round(magnitude / seconds);
      const label = `${count} ${name}${count === 1 ? '' : 's'}`;
      return future ? `in ${label}` : `${label} ago`;
    }
  }
  const seconds = magnitude;
  const label = `${seconds} seconds`;
  return future ? `in ${label}` : `${label} ago`;
}
