// path: app/not-found.tsx
import Link from 'next/link';

import { PublicShell } from '@/components/layout/public-shell';
import { SiteSearch } from '@/components/navigation/site-search';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

/**
 * The 404 page (FEATURE_LIST item 134: a branded not-found page with a search
 * bar).
 *
 * Three decisions, and the first one is why this file is at the root rather
 * than inside `app/(public)/`:
 *
 *   1. **It renders in the public shell.** An unmatched address is the one page
 *      a reader can arrive at from anywhere - an old link, a typo, a bookmark
 *      from a previous version of the site - and the answer to all three is the
 *      same: the brand, the navigation and a way to search what does exist. The
 *      shell is what carries those three, so the 404 renders inside it, and a
 *      reader who mistypes a URL gets a page of the product rather than a
 *      browser default. A group-level `not-found.tsx` would only catch misses
 *      inside its own segment, which is not the reader this page is for.
 *   2. **The copy is the state family's, not a new sentence.** The title and the
 *      description come from `states.label_error_not_found_*`, which sub-step
 *      1.24 wrote when it built the state system. A second not-found sentence
 *      written here would be two answers to the same question, and the older one
 *      is the one every surface already uses.
 *   3. **The search bar is real.** Item 134 asks for one, so it searches the one
 *      list this build actually has - the pages the navigation map publishes -
 *      and says so when nothing matches. A decorative field on the page whose
 *      whole job is to help would be the worst place in the product to fake one.
 *
 * No metadata export: Next.js reads `metadata` from pages and layouts, and this
 * file is neither. The document title on a 404 is the root layout's default,
 * which is the brand - correct, because the address the reader asked for does
 * not exist and naming it in the tab would be a lie.
 */
export default function NotFound(): React.ReactElement {
  return (
    <PublicShell>
      <section data-public-page="not-found" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('states.label_error_not_found_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">
            {t('states.label_error_not_found_description')}
          </p>
          <SiteSearch />
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild={true}>
              <Link href="/">{t('states.action_not_found_home')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
