// path: components/layout/nav-link.tsx
import { cn } from '@/lib/utils/cn';

import { type NavEntry } from './nav-items';

/**
 * NavLink: one navigation item, in the shape every navigation surface needs.
 *
 * There are three surfaces - the desktop rail, the mobile drawer and the
 * bottom bar - and they differ in layout, not in meaning. The meaning is:
 * where the link goes, what it is called, and whether it is the page the
 * reader is on. That meaning is expressed once, here, so a change to what
 * "current page" announces reaches all three surfaces at the same time.
 *
 * Accessibility, which is the reason this is a component rather than a class
 * list every surface repeats:
 *
 *   - **`aria-current="page"` on the current entry, and only on the entry.**
 *     A link that is merely styled differently is invisible to a screen
 *     reader, and a page with two links claiming to be current is worse than a
 *     page with none.
 *   - **The icon is decorative.** The visible label is the accessible name.
 *     An icon that also carried a name would make a screen reader read the
 *     item twice, which is why `aria-hidden` sits on the icon wrapper.
 *   - **The touch target is at least 44px** on every surface, from the spacing
 *     scale's `touch` step rather than from a hand-picked height, because the
 *     bottom bar is used with a thumb and the rail is used with a pointer at
 *     the same distance.
 *   - **The description, when there is one, is inside the link.** A screen
 *     reader user hears where the entry goes and what it is for before they
 *     activate it, and the visible interface is not cluttered with a second
 *     line that only a few readers need.
 *
 * The bottom bar carries a longer label than the rail and wraps it under the
 * icon; a bar label that is too long for the width available is truncated
 * rather than allowed to push the neighbouring items out of reach. Truncation
 * never hides information from a screen reader, because the accessible name is
 * the full label.
 */
export interface NavLinkProps {
  readonly entry: NavEntry;
  /** `rail` puts the icon beside the label; `bar` puts the label under it. */
  readonly layout: 'rail' | 'bar';
  readonly className?: string;
  /** Called after the link is followed, so a drawer can close itself. */
  readonly onNavigate?: () => void;
}

export function NavLink({
  entry,
  layout,
  className,
  onNavigate,
}: NavLinkProps): React.ReactElement {
  const isBar = layout === 'bar';

  return (
    <a
      href={entry.href}
      aria-current={entry.active ? 'page' : undefined}
      data-nav-id={entry.id}
      data-active={entry.active ? 'true' : 'false'}
      onClick={onNavigate}
      className={cn(
        'group flex min-w-0 items-center rounded-md text-base transition-colors duration-fast ease-standard',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isBar
          ? 'min-h-touch w-full flex-col justify-center gap-1 px-1 py-2 text-xs'
          : 'min-h-touch gap-3 px-3 py-2',
        entry.active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className,
      )}
    >
      {entry.icon === undefined ? null : (
        <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
          {entry.icon}
        </span>
      )}
      <span className={cn('min-w-0 truncate', isBar ? 'w-full text-center' : 'flex-1')}>
        {entry.label}
      </span>
      {entry.description === undefined || isBar ? null : (
        <span className="sr-only">{entry.description}</span>
      )}
    </a>
  );
}
