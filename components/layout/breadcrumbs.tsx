// path: components/layout/breadcrumbs.tsx
import { ChevronRight } from 'lucide-react';

import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * Breadcrumbs: where the reader is, and how to get back up.
 *
 * A breadcrumb is a navigation aid that answers one question - where am I in
 * the hierarchy - and it only answers it if the answer is mechanically true. So
 * the list is derived from the route rather than written by hand on each page:
 * 1.22 publishes the single navigation map, this component renders the trail it
 * is given, and no page composes its own trail. A hand-written trail drifts the
 * first time a route moves, and a trail that lies is worse than no trail.
 *
 * Three decisions worth stating:
 *
 *   - **It is a labelled landmark.** The trail sits in a `nav` element with its
 *     own accessible name, so a screen reader user can jump to it and can tell
 *     it apart from the main navigation and the bottom bar. Two unnamed
 *     navigations on one page is a menu the reader has to explore to identify.
 *   - **It is an ordered list, because the order is the information.** The
 *     hierarchy is parent-then-child; a list of links with a chevron painted
 *     between them conveys that visually and nothing else. In an `ol` it is
 *     conveyed by the structure, so the separator is decorative and `aria-hidden`.
 *   - **The last item is the current page, and it is not a link.** `aria-current`
 *     belongs on the item that is current, and a link to the page the reader is
 *     already on is a control that appears to do something and does nothing. The
 *     current item is text with `aria-current="page"`.
 *
 * The visible leaf label may be truncated on a narrow screen; the full label
 * stays in the accessible name through the `title` attribute on the item, so
 * nothing is lost to a 320px viewport. Each step is a 44 pixel tall target
 * (min-h-touch) even though the text inside it is 14px: the trail is used with
 * a thumb on a phone, and a target the height of a line of text is the one part
 * of a breadcrumb that actually gets mis-tapped, which sends the reader to the
 * parent of the page they wanted. The height is declared on the link rather
 * than on the list item around it, because the link is the element a finger
 * hits: a tall list item holding a line-height link is a target the probe can
 * see from the outside and a reader cannot hit.
 */
export interface BreadcrumbItem {
  readonly id: string;
  readonly labelKey: EnglishStringKey;
  /** Omitted (or null) for the current page, which is not a link. */
  readonly href?: string | null;
}

export interface BreadcrumbsProps {
  /** The trail, root first, current page last. An empty trail renders nothing. */
  readonly items: readonly BreadcrumbItem[];
  /** Accessible name of the landmark. */
  readonly labelKey?: EnglishStringKey;
  readonly className?: string;
}

export function Breadcrumbs({
  items,
  labelKey = 'common.label_navigation_breadcrumb',
  className,
}: BreadcrumbsProps): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={t(labelKey)} data-layout="breadcrumbs" className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const label = t(item.labelKey);
          return (
            <li key={item.id} className="flex min-h-touch min-w-0 items-center gap-x-1">
              {index === 0 ? null : (
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground"
                />
              )}
              {isLast || item.href === undefined || item.href === null ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  title={label}
                  className="truncate font-medium text-foreground"
                >
                  {label}
                </span>
              ) : (
                <a
                  href={item.href}
                  title={label}
                  className="inline-flex min-h-touch min-w-0 items-center rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
