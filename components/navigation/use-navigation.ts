// path: components/navigation/use-navigation.ts
'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

import type { BreadcrumbItem } from '@/components/layout/breadcrumbs';
import type { NavEntryInput, NavSectionInput } from '@/components/layout/nav-items';
import type { PlatformRole } from '@/components/layout/role-framing';
import { activeHrefFor, breadcrumbsFor, navigationFor, type NavAudience } from '@/config/nav-map';

/**
 * The role filter hook: what this reader is offered on this surface, right now.
 *
 * The map is pure data and pure functions, and it answers three questions: what
 * does this audience offer this role, which entry owns the current path, and
 * what is the trail to it. Two of those three depend on the path, which only
 * exists in the browser, so this hook is the one place that joins the map to
 * the router - and it is the only place in the product that calls
 * `usePathname()` for navigation.
 *
 * Why the join lives in a hook rather than in the shell. A layout is a server
 * component and a server component does not know the path it is rendering
 * under: that is deliberate in the App Router, because a layout that knew the
 * path would re-render on every navigation. The chrome that has to mark the
 * current page is client-side; the map decides what "current" means; this hook
 * is the seam, and it is small because both halves were built to meet here.
 *
 * The path is resolved once per navigation and every surface reads the same
 * answer: the rail, the drawer and the bottom bar cannot disagree about which
 * entry is current, because they are looking at one string.
 *
 * `role` is passed in rather than read here. The role comes from the session,
 * through the seam in `session-role.ts`, on the server - a client component
 * cannot read a session cookie, and a navigation surface must not fetch one.
 * When the role is null the hook returns nothing for a role-gated audience and
 * only the public entries for a public one: no role, no menu.
 */
export interface NavigationForReader {
  readonly sections: readonly NavSectionInput[];
  readonly primary: readonly NavEntryInput[];
  /** The href the surfaces compare against, or null when none is current. */
  readonly activeHref: string | null;
  /** The trail to the current page, generated from the map. */
  readonly breadcrumbs: readonly BreadcrumbItem[];
}

export function useNavigation(
  audience: NavAudience,
  role: PlatformRole | null,
): NavigationForReader {
  const pathname = usePathname();
  return useMemo(() => {
    const navigation = navigationFor(audience, role);
    return {
      sections: navigation.sections,
      primary: navigation.primary,
      activeHref: activeHrefFor(pathname, audience, role),
      breadcrumbs: breadcrumbsFor(pathname, audience, role),
    };
  }, [pathname, audience, role]);
}
