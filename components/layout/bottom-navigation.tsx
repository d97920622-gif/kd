// path: components/layout/bottom-navigation.tsx
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { resolveNavEntries, type NavEntryInput } from './nav-items';
import { NavLink } from './nav-link';

/**
 * BottomNavigation: the five things a reader does most, within thumb reach.
 *
 * On a phone the top of the screen is the hardest place to reach and the
 * bottom is the easiest, so the five entries a business owner opens every day
 * live at the bottom edge and everything else lives behind the drawer. Five is
 * not an arbitrary cap: a bar is divided into equal columns, and a sixth column
 * takes the label of every entry below the size where it can be read, which
 * turns a navigation aid into a row of guesses.
 *
 * What this component does about the device edge:
 *
 *   - **The safe-area inset is padding, not a guess.** A phone with a home
 *     indicator reserves the bottom band of the screen, and a bar that ignores
 *     it has its controls under the indicator - a broken control rather than a
 *     cosmetic flaw. The padding comes from the `--safe-bottom` token, which is
 *     the browser's own `env()` report and zero on a device that reserves
 *     nothing.
 *   - **The bar is not fixed over the content.** It is a flex item at the end
 *     of the shell column, so the page can never hide its last row behind the
 *     bar. A fixed overlay needs a matching bottom padding on the content, and
 *     the two drift apart the first time one of them changes.
 *   - **It is hidden from the medium breakpoint up**, where the rail takes
 *     over, and it is hidden in print: a navigation bar on a printed invoice is
 *     an instruction the reader cannot follow.
 *
 * The columns follow the entry count (`auto-cols-fr` in a column flow) rather
 * than a fixed five, so a workspace with four modules fills its bar instead of
 * leaving a dead column beside three cramped ones. The cap above is what keeps
 * the count small; the layout is what keeps four entries looking deliberate.
 *
 * Every entry is a link with a visible label at 12px under a 20px icon. The
 * label is small because a bar is a glanceable surface, and it is always
 * visible because an icon-only bar makes the reader guess. The touch target is
 * the whole column at least 44 pixels tall, not the glyph.
 */
export interface BottomNavigationProps {
  /** The entries, at most five. Extra entries beyond five are not rendered. */
  readonly entries: readonly NavEntryInput[];
  /** Current path, for `aria-current`. Null when no entry is current. */
  readonly activeHref?: string | null;
  /** Accessible name of the navigation landmark. */
  readonly labelKey?: EnglishStringKey;
  readonly className?: string;
}

/** The cap, and the reason the component takes a list rather than a number. */
export const BOTTOM_NAVIGATION_MAX_ITEMS = 5;

export function BottomNavigation({
  entries,
  activeHref = null,
  labelKey = 'shells.label_nav_bottom',
  className,
}: BottomNavigationProps): React.ReactElement | null {
  const resolved = resolveNavEntries(entries, activeHref).slice(0, BOTTOM_NAVIGATION_MAX_ITEMS);
  if (resolved.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label={t(labelKey)}
      data-layout="bottom-navigation"
      className={cn(
        // The bottom inset is padding on the bar rather than a fixed offset on
        // the list: a bar that grows by the device's own report keeps its items
        // where a thumb reaches them, and the class resolves through the
        // --safe-bottom token rather than a number picked for one phone.
        'w-full border-t border-border bg-card pb-[var(--safe-bottom)] text-card-foreground md:hidden',
        className,
      )}
      data-print="hide"
    >
      <ul className="grid auto-cols-fr grid-flow-col">
        {resolved.map((entry) => (
          <li key={entry.id} className="min-w-0">
            <NavLink entry={entry} layout="bar" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
