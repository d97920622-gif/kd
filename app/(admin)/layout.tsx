// path: app/(admin)/layout.tsx
import { AdminShell } from '@/components/layout/admin-shell';
import { resolveFramingRole } from '@/components/layout/session-role';
import { TopBar } from '@/components/layout/top-bar';
import { CommandPalette } from '@/components/navigation/command-palette';
import { ShellNavigationBar, ShellNavigationRail } from '@/components/navigation/shell-navigation';
import { navigationFor } from '@/config/nav-map';

/**
 * The platform administration route group: the surfaces that act on other
 * people's data, from users and tenants to payouts, disputes and the audit
 * trail.
 *
 * This layout is the most consequential frame in the product, which is why it
 * does the least: it resolves the reader's role through the same single seam
 * the workspace uses, hands it to the admin shell, and renders. The persistent
 * platform band lives in the shell, because it is a property of the frame
 * rather than of any page inside it.
 *
 * The access decision for these routes is not here and must never move here.
 * Zero Trust: the session is verified on every request, the permission matrix
 * is consulted where the data is loaded, and approval levels are enforced by
 * the approval engine before an action takes effect. A layout that refused to
 * render would be a gate in the presentation layer, and presentation layers
 * are the easiest thing in a codebase to bypass.
 *
 * The navigation arrives from the map (sub-step 1.22) for the platform audience,
 * and only when the map has something this reader may be offered, so the
 * landmark the shell paints is never an empty region. Which modules a platform
 * reader sees is the map's role filter; whether they may act inside one is the
 * permission matrix in step 4, and the two questions are kept apart on purpose.
 *
 * Outside development the seam answers null, so an admin route reached without
 * an established session renders an empty frame rather than a privileged one.
 */
const AUDIENCE = 'platform';

export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const role = resolveFramingRole('admin');
  const hasNavigation = navigationFor(AUDIENCE, role).sections.length > 0;

  return (
    <AdminShell
      role={role}
      topBar={<TopBar trailing={<CommandPalette audience={AUDIENCE} role={role} />} />}
      sidebar={hasNavigation ? <ShellNavigationRail audience={AUDIENCE} role={role} /> : undefined}
      bottomBar={hasNavigation ? <ShellNavigationBar audience={AUDIENCE} role={role} /> : undefined}
    >
      {children}
    </AdminShell>
  );
}
