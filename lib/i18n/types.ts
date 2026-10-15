// path: lib/i18n/types.ts
/**
 * Type derivation for the string catalogue.
 *
 * StringPath turns the nested catalogue object into a union of dot paths, so
 * a call to t() can only name a key that exists:
 *
 *   type Key = StringPath<typeof en>;
 *   // "common.action_save" | "common.state_loading" | "errors.not_found_frame_title" | ...
 *
 * A typo or a removed key therefore fails the type check, which is the
 * compile-time half of the no-hardcoded-string rule.
 */

import { type EnglishCatalogue } from './strings/en';

/** Maximum nesting depth accepted by the catalogue: namespace, group, key. */
export const MAX_STRING_KEY_DEPTH = 3;

/** Pattern every key segment must match: lower case snake case. */
export const STRING_KEY_SEGMENT_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/** Placeholder syntax inside a string value: {name}. */
export const STRING_PLACEHOLDER_PATTERN = /\{([a-z][a-z0-9_]*)\}/g;

/** Suffix marking the singular form of a plural pair. */
export const PLURAL_ONE_SUFFIX = '_one';

/** Suffix marking the plural form of a plural pair. */
export const PLURAL_OTHER_SUFFIX = '_other';

/** Values accepted as an interpolation parameter. */
export type StringParamValue = string | number;

/** Parameters passed to an interpolated string. */
export type StringParams = Readonly<Record<string, StringParamValue>>;

/** A leaf value of the catalogue: display text. */
export type StringLeaf = string;

/** A namespace object: either a nested group or a leaf string. */
export type StringNamespace = { readonly [key: string]: StringLeaf | StringNamespace };

/**
 * Every dot path of the catalogue, for example
 * "common.action_save" | "errors.conflict_frame_title".
 */
export type StringPath<T> = {
  [K in keyof T & string]: T[K] extends StringLeaf
    ? K
    : T[K] extends StringNamespace
      ? `${K}.${StringPath<T[K]>}`
      : never;
}[keyof T & string];

/**
 * All valid string keys of the English catalogue. The catalogue module is
 * imported as a type only, so this file carries no runtime dependency on it.
 */
export type EnglishStringKey = StringPath<EnglishCatalogue>;
