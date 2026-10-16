// path: components/layout/nav-items.ts
/**
 * The shape of a navigation item, and the one place it is turned into words.
 *
 * Every navigation surface in the product - the desktop sidebar, the mobile
 * drawer, the bottom bar, the breadcrumb trail and the command palette in
 * sub-step 1.23 - renders the same item. They differ only in how much room
 * they have for it, so they share one entry shape rather than each inventing
 * its own list of three fields that have to stay in step.
 *
 * Two decisions live here on purpose:
 *
 *   1. **Labels are catalogue keys, not sentences.** An entry carries
 *      `labelKey`, typed as the catalogue's own key union, so a navigation map
 *      that names a string nobody wrote fails the type check instead of
 *      rendering an empty tab. The words are resolved by `t()` at the moment
 *      the item is rendered, which is what keeps a future locale a data change
 *      rather than a rewrite of every menu.
 *   2. **The icon is data, not a component reference looked up by name.** Each
 *      entry carries the element to draw, and step 1.22 supplies it from the
 *      navigation map. A map from a string name to a component would be a
 *      second registry to keep correct, and the icon set has exactly one
 *      source already (Lucide).
 *
 * Active state is a property of the render, not of the data: the same entry is
 * active in the sidebar and inactive in the drawer of a different shell, so an
 * entry never claims to be current. Who knows the current path is the caller -
 * sub-step 1.22 wires the client hook that reads it - and the caller passes
 * `activeHref` down.
 */
import { t, type EnglishStringKey } from '@/lib/i18n';

/** One navigation entry, as the navigation map declares it. */
export interface NavEntryInput {
  /** Stable key, used for React lists and for the command palette in 1.23. */
  readonly id: string;
  /** Where the entry goes. A literal path, or a fragment inside one page. */
  readonly href: string;
  /** Catalogue key of the label. */
  readonly labelKey: EnglishStringKey;
  /** Optional icon, rendered at the size the surface asks for. */
  readonly icon?: React.ReactNode;
  /**
   * Catalogue key of the screen-reader description, for an entry whose label
   * is not enough on its own. Rare, and never a substitute for a clear label.
   */
  readonly descriptionKey?: EnglishStringKey;
  /**
   * Entries that are not for the reader's role are filtered out before they
   * reach a surface, so a surface never renders a disabled entry. This flag
   * exists for the one case that is not role-related: an entry whose target is
   * not built yet, which is shown while a product area is being delivered and
   * disappears when it is. It is false everywhere in the product's own
   * navigation.
   */
  readonly reserved?: boolean;
}

/** A navigation entry with its label resolved, ready to render. */
export interface NavEntry {
  readonly id: string;
  readonly href: string;
  readonly label: string;
  readonly icon?: React.ReactNode;
  readonly description?: string;
  readonly reserved: boolean;
  readonly active: boolean;
}

/** A group of entries under an optional heading, which is how the rail reads. */
export interface NavSectionInput {
  readonly id: string;
  readonly labelKey?: EnglishStringKey;
  readonly entries: readonly NavEntryInput[];
}

/**
 * Resolve one entry for rendering.
 *
 * `activeHref` is compared exactly rather than by prefix. A prefix match is
 * tempting - `/invoices` should look current on `/invoices/1042` - but it
 * makes `/invoices` a parent of `/invoices-archive`, which is a menu that
 * highlights the wrong module while the reader is looking at the right one.
 * The nested-route case belongs to whoever knows the route set, which is the
 * navigation map in 1.22, and it will pass the resolved href.
 */
export function resolveNavEntry(entry: NavEntryInput, activeHref: string | null): NavEntry {
  return {
    id: entry.id,
    href: entry.href,
    label: t(entry.labelKey),
    icon: entry.icon,
    description: entry.descriptionKey === undefined ? undefined : t(entry.descriptionKey),
    reserved: entry.reserved ?? false,
    active: activeHref !== null && activeHref === entry.href,
  };
}

/** Resolve a list of entries, dropping any that are reserved for later. */
export function resolveNavEntries(
  entries: readonly NavEntryInput[],
  activeHref: string | null,
  options: { readonly includeReserved?: boolean } = {},
): readonly NavEntry[] {
  const includeReserved = options.includeReserved ?? false;
  return entries
    .filter((entry) => includeReserved || entry.reserved !== true)
    .map((entry) => resolveNavEntry(entry, activeHref));
}

/** Resolve the entries of a group, keeping the group heading if one is set. */
export function resolveNavSection(
  section: NavSectionInput,
  activeHref: string | null,
  options: { readonly includeReserved?: boolean } = {},
): { readonly id: string; readonly label: string | null; readonly entries: readonly NavEntry[] } {
  return {
    id: section.id,
    label: section.labelKey === undefined ? null : t(section.labelKey),
    entries: resolveNavEntries(section.entries, activeHref, options),
  };
}
