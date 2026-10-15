// path: lib/utils/slug.ts
/**
 * Slug generation for URLs, file labels and machine-readable names.
 *
 * A slug is always lower case ASCII: letters, digits and single hyphens,
 * with no leading or trailing hyphen. Diacritics are folded to their base
 * letter, and any remaining non-ASCII character is removed, so a slug can
 * never carry a character that the English-only rule forbids in a URL, a
 * file name or a database value.
 *
 * Uniqueness is handled explicitly by uniqueSlug, which appends a numeric
 * suffix in a deterministic order. There is no randomness here, so the same
 * input always produces the same slug.
 *
 * This module is safe for server and browser use: it imports nothing.
 */

/** Longest slug produced by slugify. */
export const SLUG_MAX_LENGTH = 80;

/** Fallback slug when the input has no usable characters. */
export const SLUG_FALLBACK = 'item';

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_SLUG_CHARACTERS = /[^a-z0-9]+/g;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Fold a string to lower case ASCII: diacritics removed, everything that is
 * not a letter or a digit replaced with a single space.
 */
export function asciiFold(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(NON_SLUG_CHARACTERS, ' ')
    .trim();
}

/** Convert text into a URL-safe slug. */
export function slugify(input: string, maxLength: number = SLUG_MAX_LENGTH): string {
  const folded = asciiFold(input);
  if (folded.length === 0) {
    return SLUG_FALLBACK;
  }
  const hyphenated = folded.replace(/\s+/g, '-');
  const limited = hyphenated.slice(0, Math.max(1, maxLength));
  const trimmed = limited.replace(/^-+|-+$/g, '');
  return trimmed.length === 0 ? SLUG_FALLBACK : trimmed;
}

/** True when the value is a valid slug. */
export function isSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= SLUG_MAX_LENGTH &&
    SLUG_PATTERN.test(value)
  );
}

/** Append an index to a base slug: ('invoice', 2) -> 'invoice-2'. */
export function slugWithSuffix(
  base: string,
  index: number,
  maxLength: number = SLUG_MAX_LENGTH,
): string {
  if (index <= 1) {
    return base;
  }
  const suffix = `-${index}`;
  const room = Math.max(1, maxLength - suffix.length);
  return `${base.slice(0, room).replace(/-+$/, '')}${suffix}`;
}

/**
 * Deterministic unique slug: returns the base slug when it is free, or the
 * first free numbered variant (invoice, invoice-2, invoice-3 and so on).
 * `isTaken` decides membership, so a caller can back it with a database
 * query result, a set or an in-memory list.
 *
 * @param input text to slugify
 * @param isTaken predicate for an already used slug
 * @param limit highest number tried before giving up; throws RangeError past it
 */
export function uniqueSlug(
  input: string,
  isTaken: (slug: string) => boolean,
  limit = 1000,
): string {
  const base = slugify(input);
  if (!isTaken(base)) {
    return base;
  }
  for (let index = 2; index <= limit; index += 1) {
    const candidate = slugWithSuffix(base, index);
    if (!isTaken(candidate)) {
      return candidate;
    }
  }
  throw new RangeError('No free slug is available within the limit.');
}

/** Slug of a display name plus a stable disambiguator, for public URLs. */
export function slugForPublicUrl(displayName: string, disambiguator: string): string {
  const base = slugify(displayName, 60);
  const tail = slugify(disambiguator, 16);
  return `${base}-${tail}`;
}

/**
 * Slug for a file label. Kept separate from slugify so a file can never end
 * with a dot or contain a reserved device name, which matters on Windows
 * clients that download the file.
 */
export function slugifyFileName(input: string, extension?: string): string {
  const base = slugify(input, 60);
  const suffix = (extension ?? '')
    .replace(/^\./, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  if (suffix.length === 0) {
    return base;
  }
  return `${base}.${suffix}`;
}

/** Host name label safe subset: used for tenant subdomains. */
export function slugifyHostLabel(input: string): string {
  const base = slugify(input, 40);
  const cleaned = base.replace(/-/g, '').slice(0, 32);
  if (cleaned.length === 0 || /^\d+$/.test(cleaned)) {
    return `${SLUG_FALLBACK}-${base}`.replace(/-{2,}/g, '-');
  }
  return cleaned;
}
