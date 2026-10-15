// path: lib/utils/formatting.ts
/**
 * Display formatting for counts, text, sizes and masks.
 *
 * Scope rule: this module formats everything that is NOT money. Money has
 * exactly one implementation, lib/utils/currency.ts, and must never be
 * formatted here (Rule 2, docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md).
 *
 * Every function takes and returns primitives, is deterministic for the same
 * input and never depends on the runtime locale, so a rendered string is
 * identical on the server, in a build job and in the browser.
 *
 * This module is safe for server and browser use: it imports nothing.
 */

/** Group separator used for integer counts. */
export const GROUP_SEPARATOR = ',';

/** Ellipsis appended by truncate. */
export const ELLIPSIS = '...';

const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Format an integer count with thousand separators: 1234567 -> 1,234,567. */
export function formatInteger(value: number | string): string {
  const text = typeof value === 'number' ? String(Math.trunc(value)) : value.trim();
  const negative = text.startsWith('-');
  const digits = negative ? text.slice(1) : text;
  if (!/^\d+$/.test(digits)) {
    return typeof value === 'number' ? String(value) : value;
  }
  return `${negative ? '-' : ''}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR)}`;
}

/**
 * Format an already-scaled percentage: formatPercentValue('7.5') -> 7.5%.
 * The caller passes the scaled value; scaling a ratio is monetary arithmetic
 * and belongs to the money module, not here.
 */
export function formatPercentValue(
  percent: string | number,
  options: { readonly digits?: number } = {},
): string {
  const digits = options.digits ?? 2;
  const text = typeof percent === 'string' ? percent.trim() : percent.toFixed(digits);
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) {
    return `${text}%`;
  }
  return `${numeric.toFixed(digits).replace(/\.?0+$/, '')}%`;
}

/** Format a byte count with a binary unit suffix: 1536 -> 1.5 KB. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${Math.trunc(bytes)} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB', 'PB'] as const;
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const rounded = value >= 100 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

/** Cut text to a maximum length, appending an ellipsis when it was cut. */
export function truncate(text: string, maxLength: number, ellipsis = ELLIPSIS): string {
  if (maxLength <= 0) {
    return '';
  }
  if (text.length <= maxLength) {
    return text;
  }
  if (maxLength <= ellipsis.length) {
    return text.slice(0, maxLength);
  }
  return `${text.slice(0, maxLength - ellipsis.length)}${ellipsis}`;
}

/** Remove control characters and collapse runs of whitespace. */
export function collapseWhitespace(text: string): string {
  return text.replace(CONTROL_CHARACTERS, ' ').replace(/\s+/g, ' ').trim();
}

/** Capitalize the first letter and keep the rest unchanged. */
export function capitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}`;
}

/** Title case for labels: "invoice number" -> "Invoice Number". */
export function titleCase(text: string): string {
  return collapseWhitespace(text)
    .split(' ')
    .map((word) => (word.length === 0 ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
    .join(' ');
}

/** Sentence case for messages: "INVOICE SENT" -> "Invoice sent". */
export function sentenceCase(text: string): string {
  const collapsed = collapseWhitespace(text);
  if (collapsed.length === 0) {
    return collapsed;
  }
  const body = collapsed === collapsed.toUpperCase() ? collapsed.toLowerCase() : collapsed;
  return capitalize(body);
}

/** Up to two initials from a display name: "Ada Lovelace" -> AL. */
export function initials(name: string, max = 2): string {
  const words = collapseWhitespace(name)
    .split(' ')
    .filter((word) => word.length > 0);
  return words
    .slice(0, Math.max(1, max))
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** Pick the singular or plural form for a count, with the count included. */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${formatInteger(count)} ${word}`;
}

/** Human list: "a, b and c". */
export function formatList(items: readonly string[]): string {
  if (items.length === 0) {
    return '';
  }
  if (items.length === 1) {
    return items[0];
  }
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Stable text comparison for deterministic sorting. */
export function compareText(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}

/**
 * Mask an email address for display: "ada.lovelace@example.com" ->
 * "a***e@example.com". Invalid input is returned masked as a whole.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) {
    return '***';
  }
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) {
    return `***${domain}`;
  }
  return `${local.charAt(0)}***${local.charAt(local.length - 1)}${domain}`;
}

/**
 * Mask all but the last visible characters of an identifier for display:
 * maskTail('4242', 4) -> '****4242'. Used for saved methods, where only the
 * brand and last digits may be shown.
 */
export function maskTail(value: string, visible = 4): string {
  const trimmed = value.trim();
  if (trimmed.length <= visible) {
    return trimmed;
  }
  return `${'*'.repeat(trimmed.length - visible)}${trimmed.slice(-visible)}`;
}

/** Join a name from parts, skipping empty segments. */
export function joinName(parts: readonly (string | null | undefined)[]): string {
  return collapseWhitespace(
    parts.filter((part): part is string => typeof part === 'string' && part.length > 0).join(' '),
  );
}

/** Initials avatar fallback: a short label when no name is available. */
export function displayNameOrFallback(name: string | null | undefined, fallback: string): string {
  const collapsed = typeof name === 'string' ? collapseWhitespace(name) : '';
  return collapsed.length > 0 ? collapsed : fallback;
}
