// path: components/layout/admin-shell.tsx
import { MainContent } from './main-content';
import { RoleFrame } from './role-frame';
import { framingFor, roleDataAttributes, type PlatformRole } from './role-framing';
import { ShellSlots } from './shell-slots';
import { SkipLink } from './skip-link';

/**
 * AdminShell: the frame around platform administration.
 *
 * This surface acts on other people's data: approving KYC, releasing payouts,
 * suspending a tenant, editing a plan, reading an audit trail. Two design
 * consequences follow, and both are deliberate differences from the dashboard
 * shell rather than variations of it.
 *
 *   - **The reader must never forget where they are.** The warning-surface
 *     band is persistent, not dismissible: it is the one band in the product
 *     that stays on every screen, because the mistake this frame prevents -
 *     acting on a tenant's records while believing you are in your own
 *     workspace - cannot be undone by a toast. The band is also the reason a
 *     screenshot of an admin screen is never mistaken for a customer screen.
 *   - **Placing the band inside the frame is not authorization.** The frame
 *     says where the reader is; it does not decide who may be there. Admin
 *     routes are guarded by the session, the permission matrix and the
 *     approval engine, on the server, on every request (Zero Trust). A shell
 *     that refused to render would be a shell pretending to be a gate, and a
 *     gate in the presentation layer is a gate with a bypass one layer up.
 *
 * The three platform roles share this frame. Their difference is authority,
 * which the approval notice states in one line: the CEO's actions are approved
 * by the super admin, admin staff actions by the CEO or the super admin, and
 * the founder's need no notice at all. The sub-roles of admin staff (KYC
 * reviewer, payment processor, support agent and the rest) constrain which
 * screens open, which belongs to the permission matrix rather than to the
 * frame, so no sub-role appears here.
 *
 * The navigation slot is labelled as platform navigation rather than workspace
 * navigation, because the accessible name of a landmark is how a screen reader
 * user tells one region from another, and "workspace" on this page would be a
 * lie.
 */
export interface AdminShellProps {
  readonly children: React.ReactNode;
  /** Resolved by the group layout. Null when the reader is not known. */
  readonly role: PlatformRole | null;
  readonly topBar?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly bottomBar?: React.ReactNode;
}

export function AdminShell({
  children,
  role,
  topBar,
  sidebar,
  footer,
  bottomBar,
}: AdminShellProps): React.ReactElement {
  const data = roleDataAttributes(role);
  const navigation = framingFor(role)?.hasNavigation ?? false;

  return (
    <div {...data} className="flex min-h-dvh flex-col bg-muted text-foreground" data-shell="admin">
      <SkipLink />
      <ShellSlots
        navigation={navigation}
        topBar={topBar}
        sidebar={sidebar}
        footer={footer}
        bottomBar={bottomBar}
        sidebarLabelKey="shells.label_nav_platform"
        bottomBarLabelKey="shells.label_nav_platform"
      >
        <MainContent className="grid w-full content-start gap-6 px-gutter py-6">
          <RoleFrame role={role} />
          {children}
        </MainContent>
      </ShellSlots>
    </div>
  );
}
