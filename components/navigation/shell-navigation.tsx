// path: components/navigation/shell-navigation.tsx
'use client';

import { BottomNavigation } from '@/components/layout/bottom-navigation';
import type { PlatformRole } from '@/components/layout/role-framing';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { useNavigation } from '@/components/navigation/use-navigation';
import { type NavAudience } from '@/config/nav-map';

/**
 * The two navigation surfaces a shell slot receives, wired to the map.
 *
 * This module and its hook sit outside `components/layout/`, and that placement
 * is the seam (sub-step 1.21): a module under that directory may not import the
 * navigation map or read a request header, because the surfaces there are
 * presentational and the frame is what knows who is reading. Bringing the map to
 * a surface is exactly what this module does, so it lives here, one directory
 * over, where the rule can see it.
 *
 * The shells in `shell-slots.tsx` own the landmarks and the placement: the
 * sidebar slot wraps its content in a `<nav>` with an accessible name, and so
 * does the bottom-bar slot. So both components here render their surface with
 * `ownsLandmark={false}`, which is the difference between one navigation region
 * and two nested ones - a screen reader announces a nested landmark as a region
 * inside a region, and the reader has to go all the way in to learn it is the
 * same menu.
 *
 * The audience is a prop rather than something read from the route. The frame
 * knows what it is - the dashboard group is the workspace, the admin group is
 * platform administration - and a surface that guessed its audience from a path
 * would be wrong for every route it did not know about. The role comes from the
 * server layout, through the session seam.
 *
 * When the map has nothing for this reader the components render nothing at
 * all, which is the correct shape: an empty navigation region is a landmark a
 * screen reader announces and nobody can use.
 */
export interface ShellNavigationProps {
  readonly audience: NavAudience;
  readonly role: PlatformRole | null;
}

export function ShellNavigationRail({ audience, role }: ShellNavigationProps): React.ReactElement {
  const { sections, activeHref } = useNavigation(audience, role);

  return <SidebarNav sections={sections} activeHref={activeHref} ownsLandmark={false} />;
}

export function ShellNavigationBar({
  audience,
  role,
}: ShellNavigationProps): React.ReactElement | null {
  const { primary, activeHref } = useNavigation(audience, role);

  return <BottomNavigation entries={primary} activeHref={activeHref} ownsLandmark={false} />;
}
