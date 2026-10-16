// path: components/navigation/site-search.tsx
'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

import { resolveNavEntries } from '@/components/layout/nav-items';
import { StatusState } from '@/components/shared/status-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { t } from '@/lib/i18n';

import { useNavigation } from './use-navigation';

/**
 * The site search the 404 page carries (FEATURE_LIST item 134).
 *
 * What it searches is the honest part. A public site in step 1 has no content
 * index and no search service, and a "search" that queried nothing would be a
 * control that answers every question with silence. What the site does have is
 * a published list of its own pages - the navigation map - so the search
 * filters that list by name, as the reader types, and a match is a real link to
 * a real route. When the reader types a word no page carries, the empty state
 * says so and points at the navigation instead of leaving a blank list.
 *
 * The decisions:
 *
 *   - **It searches pages, not records.** Records belong to a workspace and to
 *     a session; a reader who is not signed in has none, so offering to search
 *     them would be offering a search that cannot return anything.
 *   - **No submit button, and therefore no swallowed submit.** Filtering happens
 *     as the reader types, so there is no form to send and no button that claims
 *     to do something it does not.
 *   - **The miss is a state, not a sentence.** The empty state is the empty
 *     member of the page-state family, in a polite live region, because it
 *     appears after the page has loaded and a screen reader has to be told.
 *   - **The field is labelled and 44 pixels tall.** The label is visible, not
 *     a placeholder standing in for one: a placeholder disappears the moment
 *     the reader types, and a field that loses its name is a field nobody can
 *     come back to.
 *   - **Results are links, not a list of suggestions.** Title 134 asks for a
 *     search bar on a page whose whole job is to hand the reader a way back.
 */
export interface SiteSearchProps {
  /** Maximum results rendered. The page list is short; the cap is a guard. */
  readonly limit?: number;
  readonly className?: string;
}

export function SiteSearch({ limit = 8, className }: SiteSearchProps): React.ReactElement {
  const { sections } = useNavigation('public', null);
  const [query, setQuery] = useState('');
  const fieldId = useId();

  // Labels are catalogue keys until something resolves them, and the one place
  // that turns an entry into words is `resolveNavEntries` - the same helper the
  // header and the footer render through. A search that called `t()` itself
  // would be a fourth reader of the same key.
  const entries = resolveNavEntries(
    sections.flatMap((section) => section.entries),
    null,
  );
  const needle = query.trim().toLowerCase();
  const matches =
    needle === ''
      ? []
      : entries
          .filter((entry) => entry.label.toLowerCase().includes(needle))
          .slice(0, Math.max(1, limit));

  return (
    <section
      role="search"
      aria-label={t('nav.label_site_search_label')}
      data-site-search="true"
      className={className}
    >
      <div className="grid max-w-sheet gap-2">
        <Label htmlFor={fieldId} className="text-sm font-medium">
          {t('nav.label_site_search_label')}
        </Label>
        <Input
          id={fieldId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={t('nav.label_site_search_placeholder')}
          autoComplete="off"
        />
      </div>

      {matches.length === 0 ? null : (
        <ul data-site-search-results={matches.length} className="mt-4 grid max-w-sheet gap-1">
          {matches.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className="inline-flex min-h-touch items-center text-base font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {needle === '' || matches.length > 0 ? null : (
        <StatusState
          kind="empty"
          titleKey="nav.label_site_search_empty_title"
          descriptionKey="nav.label_site_search_empty_description"
          className="mt-4 max-w-sheet"
        />
      )}
    </section>
  );
}
