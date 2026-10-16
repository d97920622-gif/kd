// path: lib/seo/site.ts
import { getEnv } from '@/lib/env/validate-env';

/**
 * The one place that answers "where does this deployment live".
 *
 * Three surfaces need an absolute URL and each one had a way to get it wrong:
 * the sitemap has to list absolute locations or a crawler rejects the file, the
 * metadata baseline has to resolve every relative image and canonical link
 * against an origin, and the print marker puts the address on paper. Three
 * copies of the same string is three chances for one of them to be missing a
 * trailing slash, and a canonical link that resolves to the wrong origin is a
 * search result pointing at somebody else's host.
 *
 * The value comes from the environment schema like every other variable: it is
 * validated once at boot by `lib/env/validate-env.ts`, and this module only
 * normalizes the shape. The normalization is the part worth having in one
 * place - `NEXT_PUBLIC_APP_URL` may be written with or without a trailing
 * slash, and both spellings have to produce the same origin.
 *
 * `unstable_`-free and dependency-free on purpose: `app/sitemap.ts`,
 * `app/robots.ts` and `app/layout.tsx` all import it during the build, and a
 * helper that pulled a route or a React module in would run at a moment when
 * neither exists.
 */

/** The deployment origin, without a trailing slash. */
export function siteUrl(): string {
  const configured = getEnv().NEXT_PUBLIC_APP_URL.trim();
  return configured.endsWith('/') ? configured.slice(0, -1) : configured;
}

/**
 * An absolute URL for a path.
 *
 * A path that is already absolute is returned unchanged, so a page may pass
 * either form and get the same answer. Everything else is joined to the origin
 * with exactly one slash between them.
 */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  if (path === '' || path === '/') {
    return siteUrl();
  }
  return path.startsWith('/') ? `${siteUrl()}${path}` : `${siteUrl()}/${path}`;
}

/** The canonical form of a path: one leading slash, no trailing slash, no query. */
export function canonicalPath(path: string): string {
  const withoutQuery = path.split(/[?#]/)[0] ?? path;
  const trimmed = withoutQuery.trim();
  if (trimmed === '' || trimmed === '/') {
    return '/';
  }
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : '/';
}
