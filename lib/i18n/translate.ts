// path: lib/i18n/translate.ts
/**
 * Typed access to the English string catalogue and placeholder
 * interpolation.
 *
 * Usage in a component:
 *   import { t, tPlural } from '@/lib/i18n';
 *   <Button>{t('common.action_save')}</Button>
 *   <p>{t('common.label_page_of', { page: 2, total: 7 })}</p>
 *   <span>{tPlural('common.selected_count', selected, { count: selected })}</span>
 *
 * Rules:
 *   - The key is typed. A key that does not exist fails the type check.
 *   - Interpolation replaces {name} placeholders. A missing parameter is a
 *     programming defect: it throws in development and test, and in
 *     production it returns the template unchanged so a typo shows as
 *     visible text instead of breaking a page for a user.
 *   - The catalogue is static data, so this module is safe on the server and
 *     in the browser, and it never imports the server-only logger.
 */
import { en, type EnglishCatalogue } from './strings/en';
import {
  PLURAL_ONE_SUFFIX,
  PLURAL_OTHER_SUFFIX,
  STRING_PLACEHOLDER_PATTERN,
  type StringParams,
  type StringParamValue,
  type StringPath,
} from './types';

export type EnglishStringKey = StringPath<EnglishCatalogue>;

/** Template string with {name} placeholders. */
export type StringTemplate = string;

function readPath(path: string): StringTemplate | null {
  const segments = path.split('.');
  let cursor: unknown = en;
  for (const segment of segments) {
    if (typeof cursor !== 'object' || cursor === null) {
      return null;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === 'string' ? cursor : null;
}

function isStrictRuntime(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/**
 * Placeholder names used by a template.
 * Exported so a caller can validate parameters without rendering.
 */
export function placeholdersOf(template: StringTemplate): string[] {
  const names: string[] = [];
  STRING_PLACEHOLDER_PATTERN.lastIndex = 0;
  let match = STRING_PLACEHOLDER_PATTERN.exec(template);
  while (match !== null) {
    names.push(match[1]);
    match = STRING_PLACEHOLDER_PATTERN.exec(template);
  }
  return names;
}

/**
 * Replace {name} placeholders with parameter values.
 * Throws when a placeholder has no parameter and the runtime is strict
 * (development or test); otherwise the template is returned unchanged.
 */
export function formatString(template: StringTemplate, params: StringParams = {}): string {
  const names = placeholdersOf(template);
  if (names.length === 0) {
    return template;
  }
  const missing = names.filter((name) => params[name] === undefined);
  if (missing.length > 0) {
    if (isStrictRuntime()) {
      throw new RangeError(
        `Missing string parameter(s): ${missing.join(', ')} for template "${template}".`,
      );
    }
    return template;
  }
  return template.replace(STRING_PLACEHOLDER_PATTERN, (_match, name: string) => {
    const value: StringParamValue | undefined = params[name];
    return value === undefined ? '' : String(value);
  });
}

/**
 * Resolve a catalogue key to display text.
 * The key type comes from the catalogue, so only real keys compile.
 */
export function t(key: EnglishStringKey, params?: StringParams): string {
  const template = readPath(key);
  if (template === null) {
    throw new RangeError(`Unknown string key: ${key}.`);
  }
  return params === undefined ? template : formatString(template, params);
}

/**
 * Resolve a plural pair. The base key names the _one and _other variants;
 * `count` is injected automatically and may be overridden by params.
 */
export function tPlural(base: EnglishStringKey, count: number, params: StringParams = {}): string {
  const suffix = count === 1 ? PLURAL_ONE_SUFFIX : PLURAL_OTHER_SUFFIX;
  return t(`${base}${suffix}` as EnglishStringKey, { count, ...params });
}

/** True when the key exists in the catalogue. */
export function hasString(key: string): boolean {
  return readPath(key) !== null;
}

/** The key when it exists, otherwise the supplied fallback text. */
export function tOrFallback(
  key: EnglishStringKey,
  fallback: string,
  params?: StringParams,
): string {
  const template = readPath(key);
  if (template === null) {
    return fallback;
  }
  return params === undefined ? template : formatString(template, params);
}

/** Number of keys in the catalogue, for diagnostics and evidence runs. */
export function stringKeyCount(): number {
  let count = 0;
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      count += 1;
      return;
    }
    if (typeof node === 'object' && node !== null) {
      for (const value of Object.values(node as Record<string, unknown>)) {
        walk(value);
      }
    }
  };
  walk(en);
  return count;
}

export { en };
export type { EnglishCatalogue };
