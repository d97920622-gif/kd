// path: components/layout/client-portal-shell.tsx
import { MainContent } from './main-content';
import { RoleFrame } from './role-frame';
import { roleDataAttributes } from './role-framing';
import { SkipLink } from './skip-link';

/**
 * ClientPortalShell: the frame around the one document a client came to see.
 *
 * The reader is not a user. They are the business owner's customer, holding a
 * link from an email, often on a phone, in the middle of their own working
 * day, and they have never seen this product before and will not see it again.
 * They did not sign in and cannot sign in: the link is the whole relationship.
 * The frame is built around that and nothing else:
 *
 *   - **No navigation, at all.** No sidebar, no top bar, no bottom bar, no
 *     breadcrumbs. A menu on this page is a way for the reader to lose the
 *     document they came for, and every link that is not the document is a
 *     place to get lost. This is why the shell does not accept slots for
 *     navigation: the omission is the design, so it is enforced by the
 *     signature rather than promised in a comment.
 *   - **One column, sized for a document.** The content is centred at the
 *     document measure, which is the same measure an invoice is read at on
 *     paper, so the screen and the printout agree.
 *   - **The chrome is the document's.** White-label tenants have their own
 *     logo and colours on this page (sub-step 11.5, checkout theming in A11),
 *     so the shell provides a single named slot for the tenant's header and
 *     renders no platform branding of its own. Whatever fills that slot is
 *     the tenant's, including the decision not to show anything.
 *
 * The frame carries no banner and no notice: there is no workflow to explain
 * to a client, and a tokenized page has no session whose limits a reader
 * needs to know. The role data attribute says `client`, which is what the
 * probe reads to prove this frame is the one that lost its navigation.
 *
 * The token that produced the page is never read here. Whether the link is
 * valid, unexpired, unused and scoped to the right invoice is decided by the
 * route that resolves it (step 11) before a shell is ever rendered. A shell
 * that checked the token would be a second implementation of that decision.
 */
export interface ClientPortalShellProps {
  readonly children: React.ReactNode;
  /** The tenant's own header, or nothing. Never platform branding. */
  readonly tenantHeader?: React.ReactNode;
}

export function ClientPortalShell({
  children,
  tenantHeader,
}: ClientPortalShellProps): React.ReactElement {
  const data = roleDataAttributes('client');

  return (
    <div
      {...data}
      className="flex min-h-dvh flex-col bg-background text-foreground"
      data-shell="client-portal"
    >
      <SkipLink />
      {tenantHeader === undefined ? null : <header className="w-full">{tenantHeader}</header>}
      <MainContent className="mx-auto grid w-full max-w-dialog content-start gap-6 px-gutter py-6">
        <RoleFrame role="client" />
        {children}
      </MainContent>
    </div>
  );
}
