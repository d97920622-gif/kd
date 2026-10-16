// path: components/layout/sidebar-nav.tsx
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { resolveNavSection, type NavSectionInput } from './nav-items';
import { NavLink } from './nav-link';

/**
 * SidebarNav: the module rail on a desktop screen.
 *
 * This is the map of a workspace. A reader who uses the product every day
 * learns where "Invoices" sits and stops reading the rail at all, which is why
 * the order of the modules is stable and why nothing here moves on its own: a
 * rail whose items reorder between visits costs the reader the very habit the
 * rail exists to build. Groups are therefore declared as data, in a fixed
 * order, and no surface sorts them.
 *
 * Decisions worth stating:
 *
 *   - **Desktop only, by width.** The rail is hidden below the medium
 *     breakpoint and the drawer takes over, from the same entries. Two
 *     navigation surfaces exist because a rail on a phone is a screen the
 *     reader cannot see the content behind, not because the product has two
 *     navigation models.
 *   - **The rail scrolls, the shell does not.** A rail with eighteen modules
 *     is taller than a short laptop screen, so the list scrolls inside the
 *     rail while the page keeps its own scroll position. The heading is not
 *     part of the scrolling list, so the reader never loses which workspace
 *     they are in.
 *   - **The landmark is named, and its name is not hardcoded.** Two navigation
 *     landmarks on one page with the same accessible name are
 *     indistinguishable in a screen reader's landmark list, so the rail takes
 *     its name from the catalogue and the frames pass the name their audience
 *     calls for - workspace navigation or platform navigation.
 *   - **A section heading is a heading, not a paragraph.** A group of modules
 *     under "Money" is a structure a screen reader user can navigate by
 *     heading, which is how a long rail stays usable without a mouse.
 *   - **Reserved entries are not rendered here.** The navigation map of
 *     sub-step 1.22 marks product areas that are not built yet; a rail item
 *     that leads to a page that does not exist is a dead end, and the check
 *     that audits links would be right to fail the build for it.
 *
 * On the two text sizes in this file: link labels are `text-base`, because a
 * label is read and is the name of a control. The section heading above a
 * group is `text-xs`, because it is a label for a group rather than reading
 * content, and the label of a labelled region is allowed below the body floor
 * as long as it never carries information the reader cannot get elsewhere - the
 * entries themselves are the information, and they are full size.
 */
export interface SidebarNavProps {
  readonly sections: readonly NavSectionInput[];
  /** Current path, for `aria-current`. Null when no entry is current. */
  readonly activeHref?: string | null;
  /** Accessible name of the navigation landmark. */
  readonly labelKey?: EnglishStringKey;
  /** Rendered above the scrolling list: the workspace or platform identity. */
  readonly header?: React.ReactNode;
  /** Rendered below the list, pinned: settings, help, version. */
  readonly footer?: React.ReactNode;
  /**
   * Whether this component declares the navigation landmark.
   *
   * True by default, because a rail standing on its own page owes the reader a
   * named landmark. False when the frame around it already declares one: the
   * shell's sidebar slot wraps its content in a `<nav>` with its own accessible
   * name (sub-step 1.20), and a rail that declared a second one would hand a
   * screen reader two nested navigation regions with the same content.
   */
  readonly ownsLandmark?: boolean;
  readonly className?: string;
}

export function SidebarNav({
  sections,
  activeHref = null,
  labelKey = 'common.label_navigation_main',
  header,
  footer,
  ownsLandmark = true,
  className,
}: SidebarNavProps): React.ReactElement | null {
  const resolved = sections.map((section) => resolveNavSection(section, activeHref));
  // Nothing to show is not an empty rail. A rail with no entries and no header
  // is a landmark a screen reader announces and the reader has to walk into to
  // find empty, so the component renders nothing at all - which is also what a
  // frame should render when the map has nothing for this reader, and what the
  // development specimen measures.
  const hasEntries = resolved.some((section) => section.entries.length > 0);
  if (!hasEntries && header === undefined && footer === undefined) {
    return null;
  }
  const content = (
    <>
      {header === undefined ? null : (
        <div className="flex min-h-touch items-center gap-3 border-b border-border px-4 py-3">
          {header}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-3">
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
                    <NavLink entry={entry} layout="rail" />
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>

      {footer === undefined ? null : <div className="border-t border-border p-3">{footer}</div>}
    </>
  );

  const surfaceClassName = cn(
    'hidden w-sidebar shrink-0 border-r border-border bg-card text-card-foreground md:flex md:flex-col',
    className,
  );

  if (!ownsLandmark) {
    return (
      <div data-layout="sidebar" className={surfaceClassName}>
        {content}
      </div>
    );
  }

  return (
    <nav aria-label={t(labelKey)} data-layout="sidebar" className={surfaceClassName}>
      {content}
    </nav>
  );
}
