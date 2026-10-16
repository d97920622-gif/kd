// path: components/public/point-list.tsx
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * The two shapes the public pages are built from: a list of catalogue
 * sentences, and a row of closing actions.
 *
 * What is deliberately not here is a section wrapper. Most of the pages in
 * sub-step 1.29 are a heading, a list and sometimes a note, and the obvious
 * refactor is one component that renders all three - which is exactly what
 * `scripts/checks/public-site.mjs` cannot see through. Its heading rules are
 * read from the page source: exactly one `h1`, at least one `h2`, and no level
 * skipped on the way down. A page whose `h1` came from a shared component would
 * either fail a rule it satisfies or force the rule to be relaxed until it
 * proves nothing, and the second failure is worse than the repetition.
 *
 * So a page writes its own headings and its own sections, and this file holds
 * the two pieces that carry no heading at all: the bullet list and the closing
 * action row. They are here because they are the same on every page - the same
 * marker, the same spacing, the same 44 pixel targets - and because a list that
 * drifts between pages is the kind of difference nobody ever files a bug about.
 */
export interface PointListProps {
  readonly pointKeys: readonly EnglishStringKey[];
  /** Two or three columns on a wide screen; one on a phone either way. */
  readonly columns?: 1 | 2 | 3;
  readonly className?: string;
}

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
};

export function PointList({
  pointKeys,
  columns = 1,
  className,
}: PointListProps): React.ReactElement {
  return (
    <ul
      data-public-points={pointKeys.length}
      className={cn('grid gap-3', COLUMN_CLASS[columns], className)}
    >
      {pointKeys.map((pointKey) => (
        <li key={pointKey} className="flex gap-3 text-sm text-muted-foreground">
          <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
          <span>{t(pointKey)}</span>
        </li>
      ))}
    </ul>
  );
}

export interface PageAction {
  readonly labelKey: EnglishStringKey;
  readonly href: string;
  readonly variant?: 'default' | 'outline' | 'ghost';
}

export interface PageActionsProps {
  readonly actions: readonly PageAction[];
  readonly id?: string;
}

export function PageActions({ actions, id = 'next' }: PageActionsProps): React.ReactElement {
  return (
    <section data-public-section={id} className="border-b border-border">
      <div className="mx-auto flex max-w-page flex-wrap items-center gap-3 px-gutter py-section">
        {actions.map((action) => (
          <Button
            key={action.href}
            asChild={true}
            variant={action.variant ?? 'default'}
            className="motion-safe:active:scale-95"
          >
            <Link href={action.href}>{t(action.labelKey)}</Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
