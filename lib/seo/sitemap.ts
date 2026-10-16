// path: lib/seo/sitemap.ts
import { NAV_MAP, type NavBlock } from '@/config/nav-map';

/**
 * What the sitemap lists, and what it deliberately does not.
 *
 * The list is not written by hand. Every destination in the sitemap is a live
 * public entry of `config/nav-map.ts`, which is already the single source of
 * destinations for the header, the footer, the palette and the link audit, so
 * a page that appears in the navigation appears here without anyone
 * remembering to add it. What this module adds is the *classification*: a
 * section of the map decides the change frequency and the priority, and a
 * section that must not be listed at all is named with the reason it is not.
 *
 * Why a section and not a page. Priority is a guess about how much a page
 * matters relative to the others, and a guess repeated per page drifts the
 * moment someone adds one. A section is a group of pages that already share a
 * subject - the product, the company, the terms - so "the product pages are
 * more important than the legal ones" is stated once and stays true as the
 * sections grow.
 *
 * The exclusion list is the part a reviewer should read. A sitemap that lists
 * everything is a sitemap that advertises the page a browser shows when there
 * is no connection, and a crawler that indexes that page sends readers to a
 * screen that says the site is unavailable.
 */

export interface SitemapSection {
  /** Block id in `config/nav-map.ts`. Every public block is listed once. */
  readonly block: string;
  readonly changeFrequency: 'weekly' | 'monthly';
  /** Relative importance, the value the sitemap protocol expects. */
  readonly priority: number;
  /** Why this section gets this frequency and this priority. */
  readonly rationale: string;
}

/**
 * The section table.
 *
 * `public-site` holds the homepage alone and takes the top priority because it
 * is the one page whose entire purpose is to be found. `public-product` is the
 * next tier: features, pricing, industries, the calculators and the generator
 * are the pages a visitor arrives on and the ones the product is judged by.
 * `public-company` is monthly because a company page changes when the company
 * does. `public-resources` documents a keyboard and `public-legal` is the
 * terms, which nobody searches for and everybody needs once.
 */
export const SITEMAP_SECTIONS: readonly SitemapSection[] = [
  {
    block: 'public-site',
    changeFrequency: 'weekly',
    priority: 1,
    rationale:
      'the homepage is the entry point a search engine resolves the brand to, so it takes the top priority and the most frequent crawl',
  },
  {
    block: 'public-product',
    changeFrequency: 'weekly',
    priority: 0.8,
    rationale:
      'the product pages are what a visitor arrives on and what the product is judged by; pricing and features move whenever the product does',
  },
  {
    block: 'public-company',
    changeFrequency: 'monthly',
    priority: 0.6,
    rationale:
      'the company pages change when the company does, which is not weekly, and a crawler that is told otherwise learns to distrust the file',
  },
  {
    block: 'public-resources',
    changeFrequency: 'monthly',
    priority: 0.5,
    rationale:
      'the shortcut reference is documentation for readers who already arrived; it is worth listing and not worth ranking above the product',
  },
  {
    block: 'public-legal',
    changeFrequency: 'monthly',
    priority: 0.3,
    rationale:
      'the terms and the privacy policy are read once by a reader who needs them; they are listed so a crawler can find them and ranked last so they never outrank the product',
  },
];

/**
 * Public blocks that are not in the sitemap, each with the reason.
 *
 * The check requires every public block to appear in exactly one of these two
 * tables, so adding a public section to the map forces a decision here instead
 * of silently listing a page that should not be listed.
 */
export const SITEMAP_EXCLUDED_SECTIONS: readonly {
  readonly block: string;
  readonly rationale: string;
}[] = [
  {
    block: 'public-states',
    rationale:
      'the offline page is what the browser shows when the reader has no connection; it is a state of the application rather than a destination, and a search result that leads to it tells the reader the site is down',
  },
];

export interface SitemapEntry {
  readonly href: string;
  readonly changeFrequency: 'weekly' | 'monthly';
  readonly priority: number;
  /** The section the entry came from, for the check and for a human reading a dump. */
  readonly block: string;
}

/** Public blocks, in map order, that the sitemap should consider. */
function publicBlocks(): readonly NavBlock[] {
  return NAV_MAP.filter((block) => block.audience === 'public');
}

/**
 * The sitemap, resolved from the map.
 *
 * A section with no decision throws rather than being skipped: the alternative
 * is a sitemap that quietly loses a page the day someone adds a public section
 * and does not read this file, and a sitemap that is missing a page looks
 * exactly like a sitemap that is complete.
 */
export function sitemapEntries(): readonly SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const block of publicBlocks()) {
    const decided = SITEMAP_SECTIONS.find((section) => section.block === block.id);
    const excluded = SITEMAP_EXCLUDED_SECTIONS.find((section) => section.block === block.id);
    if (decided === undefined) {
      if (excluded !== undefined) {
        continue;
      }
      throw new Error(`the sitemap has no decision for the public section ${block.id}`);
    }
    for (const entry of block.entries) {
      if (entry.planned === true) {
        continue;
      }
      entries.push({
        href: entry.href,
        changeFrequency: decided.changeFrequency,
        priority: decided.priority,
        block: block.id,
      });
    }
  }
  return entries;
}
