// path: components/layout/site-footer.tsx
import Link from 'next/link';

import { LogoMark } from '@/components/branding/logo-mark';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { resolveNavEntries, type NavEntryInput } from './nav-items';

/**
 * SiteFooter: the bottom band of a public page.
 *
 * The footer carries the things a reader looks for when the top of the page has
 * not answered them: who runs this, where the product areas are, and the legal
 * line. It is not a second navigation with a different opinion, so its links
 * come from the same navigation model as the header and are passed in rather
 * than written here - a footer with its own hand-written links is the classic
 * way a product ends up with two answers to "where does this go".
 *
 * Three decisions:
 *
 *   - **It is a `footer`, and that makes it the contentinfo landmark.** One per
 *     document, at the top level of the page. Nesting it inside the main content
 *     would be read as part of the page body, which is exactly the confusion the
 *     landmark exists to prevent.
 *   - **The legal line is composed, not stored.** The year is resolved at render
 *     time from a catalogue key whose placeholder is named for what it holds,
 *     so the notice cannot go stale in January and the text stays translatable.
 *     The parameter name matches the placeholder exactly: the catalogue is read
 *     strictly outside production, and a mismatch is a thrown error rather than
 *     a row of braces on a customer's page.
 *   - **Print hides the interactive parts.** A printed page keeps the brand, the
 *     note and the legal line - those are what a printed invoice needs - and
 *     drops the links, which cannot be followed on paper.
 */
export interface SiteFooterProps {
  /** Product links, rendered in one labelled group. Empty renders no group. */
  readonly links?: readonly NavEntryInput[];
  /** Heading above the link group. */
  readonly linksHeadingKey?: EnglishStringKey;
  /** Current path, for `aria-current`. Null when no link is current. */
  readonly activeHref?: string | null;
  /** Resolved at render time; injectable so a render is deterministic in tests. */
  readonly year?: number;
  readonly className?: string;
}

export function SiteFooter({
  links = [],
  linksHeadingKey = 'shells.label_footer_links_heading',
  activeHref = null,
  year = new Date().getFullYear(),
  className,
}: SiteFooterProps): React.ReactElement {
  const resolved = resolveNavEntries(links, activeHref);

  return (
    <footer
      data-layout="site-footer"
      className={cn('w-full border-t border-border bg-card text-card-foreground', className)}
    >
      <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-gutter py-section md:flex-row md:justify-between">
        <div className="flex flex-col gap-3 md:max-w-sheet">
          <div className="flex items-center gap-2">
            <LogoMark variant="glyph" size={28} />
            <span className="text-sm font-semibold">{t('brand.name')}</span>
          </div>
          <p className="text-sm text-muted-foreground">{t('shells.label_footer_note')}</p>
        </div>

        {resolved.length === 0 ? null : (
          <nav aria-label={t(linksHeadingKey)} data-print="hide" className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(linksHeadingKey)}
            </h2>
            <ul className="mt-3 grid gap-2">
              {resolved.map((entry) => (
                <li key={entry.id} className="min-w-0">
                  <Link
                    href={entry.href}
                    aria-current={entry.active ? 'page' : undefined}
                    className="inline-flex min-h-touch items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {entry.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      <div className="border-t border-border px-gutter py-4">
        <p className="mx-auto w-full max-w-page text-xs text-muted-foreground">
          {t('shells.label_footer_legal', { year })}
        </p>
      </div>
    </footer>
  );
}
