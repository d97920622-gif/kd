// path: components/layout/site-header.tsx
import Link from 'next/link';

import { LogoMark } from '@/components/branding/logo-mark';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { resolveNavEntries, type NavEntryInput } from './nav-items';

/**
 * SiteHeader: the top band of a public page, and the frame's one banner.
 *
 * Sub-step 1.28 shipped the public site without a header on purpose: a header
 * is navigation chrome, chrome owes an accessible name and a 44 pixel target on
 * every link, and inventing one for four pages and rewriting it for twelve is
 * the same work done twice. Sub-step 1.29 brought the site to twelve pages, so
 * the header arrives here.
 *
 * What it is:
 *
 *   - **A `header`, not a `nav`.** The element is the banner landmark; the
 *     navigation inside it is a `nav` with its own accessible name, so a screen
 *     reader's landmark list shows "banner" and a named navigation rather than
 *     two regions it has to explore to tell apart.
 *   - **The brand is the way home, and it is a link only when there is a home.**
 *     The footer made the same decision in 1.28: a brand that is not a link is
 *     better than a link to nowhere, so the destination is passed in and the
 *     component degrades rather than guesses.
 *   - **The entries come from the map.** They are handed to this component as
 *     `NavEntryInput`, exactly as the footer takes them, because
 *     `components/layout/` may not import `config/nav-map.ts` and the frame is
 *     what knows the destinations.
 *   - **Every link carries its own 44 pixel target.** The class sits on the
 *     `Link` element, not on the list item around it: a target on a wrapper is
 *     a control a thumb misses, and `scripts/checks/layout-shells.mjs` reads
 *     the class off the anchor for exactly that reason.
 *   - **It wraps rather than scrolls.** The public page set fits a wide screen
 *     on one row and wraps to three on a phone; a horizontally scrolling bar
 *     hides destinations behind a gesture nobody is told about, which is worse
 *     than a taller header.
 *   - **Print hides the navigation.** A printed page keeps the brand; a list of
 *     links cannot be followed on paper.
 *
 * The heading over the list is the accessible name of the `nav` rather than a
 * visible heading: a header is a bar, and a heading inside a bar reads as a
 * section that started somewhere the reader cannot see. The footer next to it
 * does print the name, because a footer is a list a reader scans by heading.
 */
export interface SiteHeaderProps {
  /** Live public entries, rendered as one labelled navigation. Empty renders none. */
  readonly links?: readonly NavEntryInput[];
  /** Heading used as the accessible name of the navigation. */
  readonly linksHeadingKey?: EnglishStringKey;
  /** Current path, for `aria-current`. Null when no link is current. */
  readonly activeHref?: string | null;
  /** Where the brand goes. Omitted when there is nowhere to go. */
  readonly homeHref?: string;
  /** Accessible name of the home link, when the brand is one. */
  readonly homeLabelKey?: EnglishStringKey;
  readonly className?: string;
}

export function SiteHeader({
  links = [],
  linksHeadingKey = 'shells.label_nav_site',
  activeHref = null,
  homeHref,
  homeLabelKey = 'shells.label_brand_home',
  className,
}: SiteHeaderProps): React.ReactElement {
  const resolved = resolveNavEntries(links, activeHref);

  return (
    <header
      data-layout="site-header"
      className={cn('w-full border-b border-border bg-card text-card-foreground', className)}
    >
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-6 gap-y-2 px-gutter py-3">
        {homeHref === undefined ? (
          <div className="flex items-center gap-2">
            <LogoMark variant="glyph" size={28} />
            <span className="text-sm font-semibold">{t('brand.name')}</span>
          </div>
        ) : (
          <Link
            href={homeHref}
            aria-label={t(homeLabelKey)}
            className="flex min-h-touch items-center gap-2"
          >
            <LogoMark variant="glyph" size={28} />
            <span className="text-sm font-semibold">{t('brand.name')}</span>
          </Link>
        )}

        {resolved.length === 0 ? null : (
          <nav aria-label={t(linksHeadingKey)} data-print="hide" className="min-w-0">
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-1">
              {resolved.map((entry) => (
                <li key={entry.id} className="min-w-0">
                  <Link
                    href={entry.href}
                    aria-current={entry.active ? 'page' : undefined}
                    className="inline-flex min-h-touch items-center rounded-md px-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-[current=page]:font-semibold aria-[current=page]:text-foreground"
                  >
                    {entry.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
