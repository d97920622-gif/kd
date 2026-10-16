// path: app/(dashboard)/layout.tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { resolveFramingRole } from '@/components/layout/session-role';
import { ShellNavigationBar, ShellNavigationRail } from '@/components/navigation/shell-navigation';
import { navigationFor } from '@/config/nav-map';

/**
 * The tenant workspace route group: everything a business does inside its own
 * account, from invoices to payroll to settings.
 *
 * The layout does three things and no more. It resolves the reader's role
 * through the single documented seam, hands it to the shell, and renders the
 * shell. There is no data fetching here, no permission check and no redirect:
 * a layout runs on the server for every route beneath it, and the checks that
 * belong to a request - is this reader signed in, may this reader see this
 * record - are made where the record is loaded, not here. A layout is a frame,
 * not a gate.
 *
 * The navigation now comes from the map (sub-step 1.22). Two things about how
 * it arrives are deliberate:
 *
 *   - **The audience is stated here, not guessed.** This group is the tenant
 *     workspace, so it asks the map for the workspace audience. The map holds
 *     four audiences and a surface that inferred its own from a path would
 *     offer the wrong modules on every route it had not been told about.
 *   - **The slot is filled only when the map has something for this reader.**
 *     A filled slot renders the shell's landmark, and a landmark whose content
 *     renders nothing is a navigation region a screen reader announces and
 *     nobody can use. The map is pure data, so asking it on the server costs
 *     one function call.
 *
 * The module entries themselves are still planned: step 1 has not built a single
 * product page, and the map refuses to name a destination before the page
 * exists. The day the first workspace page lands, its entry becomes live and the
 * rail appears here with no change to this file.
 *
 * Outside development the seam answers null and the shell renders the frame
 * with no navigation: a workspace page reached without an established session
 * shows its structure and nothing it could act on.
 */
const AUDIENCE = 'workspace';

export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const role = resolveFramingRole('dashboard');
  const hasNavigation = navigationFor(AUDIENCE, role).sections.length > 0;

  return (
    <DashboardShell
      role={role}
      sidebar={hasNavigation ? <ShellNavigationRail audience={AUDIENCE} role={role} /> : undefined}
      bottomBar={hasNavigation ? <ShellNavigationBar audience={AUDIENCE} role={role} /> : undefined}
    >
      {children}
    </DashboardShell>
  );
}
