// path: app/(dashboard)/layout.tsx
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { resolveFramingRole } from '@/components/layout/session-role';

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
 * What this group deliberately does not define yet: the module navigation,
 * the tenant switcher and the footer. Those are the layout components in
 * sub-step 1.21 and the navigation map in 1.22, and the shell already has the
 * slots for them, so nothing in this file changes when they land.
 *
 * Outside development the seam answers null and the shell renders the frame
 * with no navigation: a workspace page reached without an established session
 * shows its structure and nothing it could act on.
 */
export default function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <DashboardShell role={resolveFramingRole('dashboard')}>{children}</DashboardShell>;
}
