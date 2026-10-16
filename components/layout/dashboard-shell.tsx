// path: components/layout/dashboard-shell.tsx
import { MainContent } from './main-content';
import { RoleFrame } from './role-frame';
import { framingFor, roleDataAttributes, type PlatformRole } from './role-framing';
import { ShellSlots } from './shell-slots';
import { SkipLink } from './skip-link';

/**
 * DashboardShell: the frame around the tenant's own workspace.
 *
 * This is where a business runs itself: invoices, estimates, clients,
 * payments, products, expenses, projects, payroll, reports and settings. The
 * frame is built for a reader who returns to it every day and knows it well,
 * which is the opposite brief from the public shell. Familiarity beats
 * novelty: the workspace surface is quiet, the content gets the space, and the
 * role band appears only when the reader is the owner's staff, because their
 * work is reviewed and they are the reader most likely to be surprised by it.
 *
 * Role-aware, at the level a frame can be honest about. The shell takes the
 * role it was given, renders the band the framing table calls for and puts the
 * role and audience on the root element as data attributes, so the rendered
 * page can be measured rather than assumed. It makes no access decision: an
 * owner and the owner's staff see the same frame, and which of them may send
 * an invoice is answered by the permission matrix on the server, not by a
 * layout. An unknown reader gets the frame with no band and, outside
 * development, no navigation, which is what failing closed looks like.
 *
 * The slots are the seams 1.21 fills: the sidebar carries the module
 * navigation, the top bar carries the tenant context and the account menu, the
 * footer carries the legal links on the long pages, and the bottom bar is the
 * mobile navigation. Until they are filled there is no landmark, no empty
 * region and nothing to announce.
 */
export interface DashboardShellProps {
  readonly children: React.ReactNode;
  /** Resolved by the group layout. Null when the reader is not known. */
  readonly role: PlatformRole | null;
  readonly topBar?: React.ReactNode;
  readonly sidebar?: React.ReactNode;
  readonly footer?: React.ReactNode;
  readonly bottomBar?: React.ReactNode;
}

export function DashboardShell({
  children,
  role,
  topBar,
  sidebar,
  footer,
  bottomBar,
}: DashboardShellProps): React.ReactElement {
  const data = roleDataAttributes(role);
  const navigation = framingFor(role)?.hasNavigation ?? false;

  return (
    <div
      {...data}
      className="flex min-h-dvh flex-col bg-background text-foreground"
      data-shell="dashboard"
    >
      <SkipLink />
      <ShellSlots
        navigation={navigation}
        topBar={topBar}
        sidebar={sidebar}
        footer={footer}
        bottomBar={bottomBar}
      >
        <MainContent className="grid w-full content-start gap-6 px-gutter py-6">
          <RoleFrame role={role} />
          {children}
        </MainContent>
      </ShellSlots>
    </div>
  );
}
