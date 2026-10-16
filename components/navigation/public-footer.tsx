// path: components/navigation/public-footer.tsx
'use client';

import { SiteFooter } from '@/components/layout/site-footer';
import { useNavigation } from '@/components/navigation/use-navigation';

/**
 * The public footer, wired to the navigation map.
 *
 * This module exists for one reason, and it is the same reason
 * `shell-navigation.tsx` sits here rather than in `components/layout/`: a
 * module under that directory may not import the navigation map, because the
 * surfaces there are presentational and the frame is what knows the
 * destinations. The public shell renders this component, this component reads
 * the map, and the rule has one seam to watch instead of a directory of files
 * that each quietly fetch their own truth.
 *
 * Three decisions:
 *
 *   1. **The whole public audience, not a hand-picked list.** The footer
 *      renders every live public entry, so a page that goes live in a later
 *      sub-step appears here in the same commit as its entry in the map. A
 *      footer with its own list would be a second opinion about what the site
 *      contains, and it would go stale silently.
 *   2. **The homepage entry becomes the brand link, not a list item.** "Home"
 *      beside "Features" and "Pricing" is a list item that means something
 *      different from its neighbours; the brand mark is where a reader looks
 *      for it. The entry is still in the map, so the destination has one owner.
 *   3. **The group is named for what it holds.** Sub-step 1.29 flipped the last
 *      seven public pages live, so the list below the heading stopped being the
 *      product links and became the site: the group asks for
 *      `shells.label_site_pages_heading` rather than keeping the 1.23 name,
 *      which now describes only part of what a reader sees.
 *   4. **A reader with no role still gets the footer.** The public audience is
 *      the one audience that needs no session, and the hook is asked for it
 *      with a null role. If the map ever publishes nothing for that audience,
 *      the footer renders the brand and the legal line and no link group, which
 *      is an empty navigation region avoided rather than announced.
 */
export function PublicFooter(): React.ReactElement {
  const { sections, activeHref } = useNavigation('public', null);
  const entries = sections.flatMap((section) => section.entries);
  const home = entries.find((entry) => entry.id === 'home');
  const links = entries.filter((entry) => entry.id !== 'home');

  return (
    <SiteFooter
      links={links}
      linksHeadingKey="shells.label_site_pages_heading"
      activeHref={activeHref}
      homeHref={home?.href}
    />
  );
}
