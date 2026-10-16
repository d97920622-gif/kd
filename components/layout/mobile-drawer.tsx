// path: components/layout/mobile-drawer.tsx
'use client';

import { Menu } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { t, type EnglishStringKey } from '@/lib/i18n';

import { resolveNavSection, type NavSectionInput } from './nav-items';
import { NavLink } from './nav-link';

/**
 * MobileDrawer: the same navigation as the rail, behind a button, on a phone.
 *
 * A phone screen is around 375 CSS pixels wide and the rail needs 256 of them,
 * so the rail is hidden below the medium breakpoint and this takes its place.
 * The entries are the same entries in the same order: one navigation model,
 * two presentations, which is what keeps a reader's habit intact when they move
 * between a desk and a phone.
 *
 * Three decisions:
 *
 *   - **It is a dialog, not a special case.** The drawer is built on the
 *     project's Sheet primitive, which is Radix Dialog wearing an edge. That
 *     buys the focus trap, Escape to close, the inert background and the
 *     requirement that a dialog has a title - all of which a hand-rolled
 *     slide-over gets wrong, and gets wrong for keyboard and screen reader
 *     users specifically.
 *   - **The trigger is a real button with a real name.** A hamburger icon is
 *     not a name. The button carries the catalogue label, which is also what a
 *     screen reader announces, and it is at least 44px in each direction
 *     because a thumb is not a pointer.
 *   - **Navigating closes the drawer, and the state is owned here.** The Sheet
 *     is controlled rather than uncontrolled: the drawer holds one boolean and
 *     hands every entry a handler that closes it before the route changes. The
 *     alternative - reaching into the panel's DOM to press its close button -
 *     works until Radix renames something, and it is the kind of code that
 *     looks fine in a screenshot and fails for a keyboard user. The click is
 *     never prevented or stopped, so a modified click, a middle click and a
 *     keyboard activation all still reach the browser as they would anywhere
 *     else.
 *
 * The panel is a side sheet and its own scroll container: a workspace with
 * eighteen modules has more entries than a phone has height, so the list
 * scrolls inside the panel while the button that opened it stays reachable.
 *
 * It opens from the leading edge, so it consumes the leading inset
 * (`--safe-left`): in landscape on a phone with a cut-out the panel's own edge
 * is the screen edge, and content drawn there is content the reader cannot see.
 * The inset is the device's report and zero everywhere else.
 */
export interface MobileDrawerProps {
  readonly sections: readonly NavSectionInput[];
  /** Current path, for `aria-current`. Null when no entry is current. */
  readonly activeHref?: string | null;
  /** Accessible name of the navigation landmark inside the panel. */
  readonly labelKey?: EnglishStringKey;
  /** Rendered above the entries inside the panel: workspace identity. */
  readonly header?: React.ReactNode;
  readonly triggerClassName?: string;
}

export function MobileDrawer({
  sections,
  activeHref = null,
  labelKey = 'common.label_navigation_main',
  header,
  triggerClassName,
}: MobileDrawerProps): React.ReactElement {
  const [open, setOpen] = useState(false);
  const resolved = sections.map((section) => resolveNavSection(section, activeHref));
  const closeDrawer = (): void => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t('common.label_open_menu')}
          data-layout="drawer-trigger"
          className={triggerClassName}
        >
          <Menu aria-hidden="true" className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-4/5 max-w-sheet pl-[var(--safe-left)] text-card-foreground"
      >
        <SheetHeader className="border-b border-border p-4 pr-12">
          <SheetTitle className="text-base">{t('shells.label_nav_drawer_title')}</SheetTitle>
          <SheetDescription className="text-sm">
            {t('shells.label_nav_drawer_description')}
          </SheetDescription>
        </SheetHeader>

        {header === undefined ? null : (
          <div className="border-b border-border px-4 py-3">{header}</div>
        )}

        <nav
          aria-label={t(labelKey)}
          data-layout="drawer"
          className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3"
        >
          {resolved.map((section) =>
            section.entries.length === 0 ? null : (
              <div key={section.id} className="grid gap-1">
                {section.label === null ? null : (
                  <h2 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {section.label}
                  </h2>
                )}
                <ul className="grid gap-1">
                  {section.entries.map((entry) => (
                    <li key={entry.id} className="min-w-0">
                      <NavLink entry={entry} layout="rail" onNavigate={closeDrawer} />
                    </li>
                  ))}
                </ul>
              </div>
            ),
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
