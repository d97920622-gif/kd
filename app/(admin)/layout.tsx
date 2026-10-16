// path: app/(admin)/layout.tsx
import { AdminShell } from '@/components/layout/admin-shell';
import { resolveFramingRole } from '@/components/layout/session-role';

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
 * Outside development the seam answers null, so an admin route reached without
 * an established session renders an empty frame rather than a privileged one.
 */
export default function AdminLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <AdminShell role={resolveFramingRole('admin')}>{children}</AdminShell>;
}
