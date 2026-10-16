// path: lib/seo/robots.ts
/**
 * What a crawler is told, and what it is refused.
 *
 * Two rules, and the order between them matters.
 *
 *   1. **A preview is not the site.** A deployment that is not the production
 *      one disallows everything. The development gallery answers 404 there, but
 *      the public pages do not, and a preview host that gets indexed competes
 *      with the real site for its own content and shows a reader a page whose
 *      pricing may be a draft. `NODE_ENV` is what decides, and it is the build
 *      that sets it, so the file a preview serves cannot be changed by a
 *      runtime switch.
 *   2. **Production refuses three paths and allows the rest.** Nothing in this
 *      product is a private page yet - there are no signed-in routes - so the
 *      allow side is the default and the refusal list is short and named. The
 *      rule this file follows is that a disallowed path is one the product has
 *      a reason to write down: an API response is not a document, build output
 *      is content-addressed files rather than pages, and the component gallery
 *      is a development tool that answers 404 in production.
 *
 * The human-facing half of the same subject is the admin control in
 * FEATURE_LIST item 2528: a later step's CMS row overrides the table below so
 * an operator can refuse a path without a release. The route reads this module
 * and nothing else, so that row replaces the data rather than the policy.
 */

/** A refused path with the reason it is refused. */
export interface RobotsDisallowRule {
  readonly path: string;
  readonly rationale: string;
}

/**
 * The refused paths in production.
 *
 * `/_next/` is listed even though those files are immutable and harmless: a
 * crawler that indexes a JavaScript chunk surfaces it in search results as a
 * page with no title, which is a result the product paid for with its own
 * crawl budget.
 */
export const ROBOTS_DISALLOWED_PATHS: readonly RobotsDisallowRule[] = [
  {
    path: '/api/',
    rationale:
      'an API response is not a page: it has no title, no description and no meaning to a reader who arrives from a search result',
  },
  {
    path: '/_next/',
    rationale:
      'build output is content-addressed files rather than pages, and an indexed script chunk is a search result with nothing in it',
  },
  {
    path: '/gallery',
    rationale:
      'the component gallery is a development tool; it answers 404 outside development, so a crawler has no page to index there and every request it makes is a wasted one',
  },
];

/** Where a crawler finds the list of pages it may index. */
export const ROBOTS_SITEMAP_PATH = '/sitemap.xml';

/** The user agent every rule applies to, spelled the way the protocol expects. */
export const ROBOTS_USER_AGENT = '*';

export interface RobotsPolicy {
  readonly userAgent: string;
  /** Paths refused, in the order the file writes them. */
  readonly disallow: readonly string[];
  /** Whether the file allows anything at all. */
  readonly allowsCrawling: boolean;
  /**
   * The sitemap location, relative, or null when there is none to advertise.
   * The route is what turns it into an absolute URL.
   */
  readonly sitemapPath: string | null;
}

/**
 * The policy for one environment.
 *
 * Development answers `Disallow: /` and nothing else, without a sitemap line:
 * a preview that lists paths invites the crawler to fetch exactly the pages it
 * was told to leave alone, and a sitemap is a list of paths.
 */
export function robotsPolicy(environment: 'development' | 'production'): RobotsPolicy {
  if (environment === 'development') {
    return {
      userAgent: ROBOTS_USER_AGENT,
      disallow: ['/'],
      allowsCrawling: false,
      sitemapPath: null,
    };
  }
  return {
    userAgent: ROBOTS_USER_AGENT,
    disallow: ROBOTS_DISALLOWED_PATHS.map((rule) => rule.path),
    allowsCrawling: true,
    sitemapPath: ROBOTS_SITEMAP_PATH,
  };
}
