// path: lib/i18n/index.ts
/**
 * Public surface of the internationalisation layer.
 *
 * Import from here in application code:
 *   import { t, tPlural } from '@/lib/i18n';
 *   import { en } from '@/lib/i18n/strings/en';
 *
 * The catalogue is plain data with pure helpers, so this module is safe in
 * server components, client components and tests-free build scripts alike.
 */
export {
  en,
  formatString,
  hasString,
  placeholdersOf,
  stringKeyCount,
  t,
  tOrFallback,
  tPlural,
} from './translate';

export type {
  EnglishCatalogue,
  EnglishPluralKey,
  EnglishStringKey,
  StringTemplate,
} from './translate';

export type { PluralStringPath } from './types';

export {
  MAX_STRING_KEY_DEPTH,
  PLURAL_ONE_SUFFIX,
  PLURAL_OTHER_SUFFIX,
  STRING_KEY_SEGMENT_PATTERN,
  STRING_PLACEHOLDER_PATTERN,
} from './types';

export type { StringNamespace, StringParams, StringParamValue, StringPath } from './types';
