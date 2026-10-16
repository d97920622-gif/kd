// path: app/sitemap.ts
import { type MetadataRoute } from 'next';

import { absoluteUrl } from '@/lib/seo/site';
import { sitemapEntries } from '@/lib/seo/sitemap';

/**
 * /sitemap.xml, built from the navigation map.
 *
 * The route is one line of work because the decisions live in
 * `lib/seo/sitemap.ts`: which public sections are listed, how often each is
 * expected to change and how important each is relative to the others. This
 * file turns that data into the shape the sitemap protocol wants, with one
 * addition it is the only place able to make - the absolute URL, because only
 * the deployment knows its own origin.
 *
 * `lastModified` is the moment the file is generated. That is the honest value
 * for a static route: the page was rendered from this build's content, and the
 * only thing a crawler is being told is that the content it would fetch is the
 * content of this release. A date invented per page - the date of a commit, or
 * a date read from a content record that does not exist yet - would be a
 * number nobody maintains, and a sitemap that claims every page changed
 * yesterday is a sitemap crawlers learn to ignore.
 *
 * The blog's own entries join this list when the blog is fed from the database
 * in step 5 (FEATURE_LIST item 2525 asks for CMS and blog pages in the
 * sitemap); the route keeps its shape, and `sitemapEntries()` grows a second
 * source rather than being replaced.
 */
/**
 * Static on purpose, against the root layout's per-request default: the sitemap
 * is generated from data that changes with a release, and a nonce policy is a
 * rule about documents that run scripts. This route runs none, so it is
 * generated once per build and served as a file.
 */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();
  return sitemapEntries().map((entry) => ({
    url: absoluteUrl(entry.href),
    lastModified: generatedAt,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));
}
