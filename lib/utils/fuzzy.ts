// path: lib/utils/fuzzy.ts
/**
 * Fuzzy matching: the search behind the command palette.
 *
 * The plan asks for fuzzy search over commands, pages and - later - records
 * (FEATURE_LIST E3.172). Fuzzy has to mean something specific, or it means
 * "whatever the first implementation did", so three rules are written down
 * here and everything that searches goes through them:
 *
 *   1. **A subsequence is a match.** The characters of the query have to
 *      appear in the text in order, not necessarily next to each other, so
 *      `inv` finds `Invoices` and `createdinv` finds `Create invoice`. A plain
 *      substring search is the failure mode this avoids: the reader types the
 *      two words they remember and gets nothing.
 *   2. **Where the match starts decides the rank.** A query that matches the
 *      beginning of the text outranks one that matches the middle, and a match
 *      at a word boundary outranks one inside a word. This is what makes `pa`
 *      offer `Payments` before `Recurring payments`, and it is the whole reason
 *      a ranked list is worth having over an alphabetical one.
 *   3. **Equal scores keep the source order.** The source order is the order the
 *      product declares - the map's blocks, the registry's rows - and it is
 *      meaningful. A sort that is not stable would shuffle two commands of equal
 *      rank between keystrokes, which reads as the list twitching.
 *
 * An empty query matches everything with the same score, which is what makes
 * the palette open on the full list rather than on an empty panel: the reader
 * who does not know the word they want can still see what exists.
 */

/** Why one match outranks another, largest first. Exported for the check. */
export const FUZZY_SCORES = {
  /** The whole text, exactly. The reader typed what they wanted. */
  exact: 1000,
  /** The text starts with the query. */
  prefix: 500,
  /** A word inside the text starts with the query. */
  wordBoundary: 300,
  /** The query appears inside the text, not at a boundary. */
  substring: 150,
  /** The query's characters appear in order, spread out. */
  subsequence: 50,
} as const;

/** Bonus for each character that follows the previous one immediately. */
const CONSECUTIVE_BONUS = 5;
/** Bonus when the matched region is short relative to the text. */
const TIGHTNESS_BONUS = 20;

/**
 * Score one text against one query. Zero means no match, and the caller uses
 * that as the filter. The score is only ever compared with another score from
 * this function, so it is a rank, not a measurement.
 */
export function fuzzyScore(query: string, text: string): number {
  const needle = query.trim().toLowerCase();
  const haystack = text.toLowerCase();
  if (needle === '') {
    return FUZZY_SCORES.substring;
  }
  if (haystack === needle) {
    return FUZZY_SCORES.exact;
  }
  if (haystack.startsWith(needle)) {
    return FUZZY_SCORES.prefix + lengthBonus(needle, haystack);
  }
  const boundary = wordBoundaryIndex(haystack, needle);
  if (boundary !== -1) {
    return FUZZY_SCORES.wordBoundary + lengthBonus(needle, haystack) - boundary;
  }
  const substring = haystack.indexOf(needle);
  if (substring !== -1) {
    return FUZZY_SCORES.substring + lengthBonus(needle, haystack) - substring;
  }
  return subsequenceScore(needle, haystack);
}

/**
 * The score of a text in which the query's characters appear in order, or zero
 * when they do not. A short match inside a long text is worth less than a match
 * that uses most of it, which is what keeps a two-letter query from ranking
 * every entry the same.
 */
function subsequenceScore(needle: string, haystack: string): number {
  let cursor = 0;
  let first = -1;
  let consecutive = 0;
  let matched = 0;
  for (let index = 0; index < haystack.length && matched < needle.length; index += 1) {
    if (haystack[index] !== needle[matched]) {
      continue;
    }
    if (first === -1) {
      first = index;
    }
    if (index > 0 && cursor === index) {
      consecutive += 1;
    }
    cursor = index + 1;
    matched += 1;
  }
  if (matched < needle.length) {
    return 0;
  }
  const spread = haystack.length - first;
  return Math.max(
    1,
    FUZZY_SCORES.subsequence +
      consecutive * CONSECUTIVE_BONUS -
      spread +
      lengthBonus(needle, haystack),
  );
}

function wordBoundaryIndex(haystack: string, needle: string): number {
  let index = haystack.indexOf(needle);
  while (index > 0) {
    if (isBoundary(haystack[index - 1])) {
      return index;
    }
    index = haystack.indexOf(needle, index + 1);
  }
  return -1;
}

function isBoundary(character: string): boolean {
  return character === ' ' || character === '-' || character === '/' || character === '.';
}

/**
 * A small bonus for a query that covers most of the text: `pay` should rank
 * `Payments` above `Payments and payouts`, because the first is what the reader
 * named.
 */
function lengthBonus(needle: string, haystack: string): number {
  if (haystack.length === 0) {
    return 0;
  }
  return Math.round(TIGHTNESS_BONUS * (needle.length / haystack.length));
}

/**
 * Rank a list by its fuzzy score, dropping everything that does not match, and
 * keeping the source order among equal scores.
 *
 * The text a row is matched against is passed in rather than read off the item,
 * because what a reader types against a command is its label *and* its group -
 * `global` finds every global command - while the labels it sees stay
 * unchanged. One more reason the score is computed from one string: the
 * alternative is scoring against several fields in the middle of the sort.
 */
export function rankByFuzzyMatch<T>(
  query: string,
  items: readonly T[],
  textOf: (item: T) => string,
): readonly T[] {
  const ranked: { readonly item: T; readonly score: number; readonly index: number }[] = [];
  items.forEach((item, index) => {
    const score = fuzzyScore(query, textOf(item));
    if (score > 0) {
      ranked.push({ item, score, index });
    }
  });
  ranked.sort((left, right) => right.score - left.score || left.index - right.index);
  return ranked.map((entry) => entry.item);
}
