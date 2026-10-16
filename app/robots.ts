// path: app/robots.ts
import { type MetadataRoute } from 'next';

import { robotsPolicy, ROBOTS_SITEMAP_PATH } from '@/lib/seo/robots';
import { absoluteUrl } from '@/lib/seo/site';

/**
 * /robots.txt, generated rather than committed.
 *
 * A committed robots.txt is a file that is correct on the day it is written and
 * wrong on the day the site grows a section nobody remembers to add to it. This
 * route generates the file from `lib/seo/robots.ts`, where the refused paths are
 * listed with the reason each is refused, so the rule and the reasoning are
 * reviewed together and neither can drift from the other.
 *
 * Both halves of the file come from the environment the build is running in,
 * through the same switch `next.config.js` uses for the header matrix:
 * `next start` serves production's rules and `next dev` serves a preview's,
 * which disallows everything.
 *
 * The `Sitemap` line is written only when there is a sitemap to point at. A
 * preview that told a crawler "nothing here is for you, and here is the list of
 * everything" would be handing over the paths it just refused.
 */
/**
 * Static on purpose, against the root layout's per-request default: the crawler
 * file is generated from data that changes with a release, and a nonce policy
 * is a rule about documents that run scripts. This route runs none, so it is
 * generated once per build and served as a file.
 */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const policy = robotsPolicy(environment);
  const sitemap = policy.sitemapPath ?? ROBOTS_SITEMAP_PATH;
  const rules: MetadataRoute.Robots['rules'] = policy.allowsCrawling
    ? { userAgent: policy.userAgent, allow: '/', disallow: [...policy.disallow] }
    : { userAgent: policy.userAgent, disallow: policy.disallow[0] ?? '/' };
  return {
    rules,
    ...(policy.sitemapPath === null ? {} : { sitemap: absoluteUrl(sitemap) }),
  };
}
