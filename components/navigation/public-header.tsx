// path: components/navigation/public-header.tsx
'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { useNavigation } from '@/components/navigation/use-navigation';

/**
 * The public header, wired to the navigation map.
 *
 * It is here for the same reason `public-footer.tsx` is: a module under
 * `components/layout/` may not import `config/nav-map.ts`, so the frame stays
 * presentational and this module - one file, one seam - is what reads the map.
 * The public shell renders it above the main landmark, the footer renders below
 * it, and both ask the same hook for the same audience, so the two surfaces
 * cannot disagree about what the site contains or about which page is current.
 *
 * Two decisions:
 *
 *   1. **The whole public audience.** The header renders every live public
 *      entry, so a page that goes live appears in the header in the same commit
 *      as its entry in the map. A header with its own list of four links is a
 *      second opinion about the site, and the second opinion is the one that
 *      goes stale.
 *   2. **The homepage entry becomes the brand, not a list item.** "Home" beside
 *      "Features" and "Pricing" means something different from its neighbours;
 *      the brand mark is where a reader looks for it. The entry stays in the map,
 *      so its destination still has exactly one owner.
 *   3. **The header offers the primary set, not every page.** The public site is
 *      fifteen pages; fifteen links in a bar is a list nobody reads and a phone
 *      header three rows tall. The map already separates the destinations a
 *      reader is meant to see without scrolling from the rest, so the header
 *      renders that set and the footer below it renders every live page - one
 *      list with two windows onto it, and neither window hand-picked here.
 */
export function PublicHeader(): React.ReactElement {
  const { sections, primary, activeHref } = useNavigation('public', null);
  const home = sections.flatMap((section) => section.entries).find((entry) => entry.id === 'home');
  const links = primary.filter((entry) => entry.id !== 'home');

  return <SiteHeader links={links} activeHref={activeHref} homeHref={home?.href} />;
}
