// path: app/(client-portal)/layout.tsx
import { ClientPortalShell } from '@/components/layout/client-portal-shell';

/**
 * The client portal route group: the pages a tenant's own customer reaches
 * through a tokenized link, without an account and without signing in.
 *
 * The framing role here is `client`, and it is not resolved through the
 * session seam because there is no session to resolve: the sixth audience of
 * this platform never has one. What the reader may see is decided by the token
 * in the link, which the route that resolves it validates before this shell is
 * rendered (step 11). The shell takes no role argument for that reason - it
 * cannot be handed the wrong one - and it accepts no navigation slots, because
 * a menu on a single-document page is a way for the reader to get lost.
 *
 * The pages themselves are step 11 work: the checkout page is step 10 and the
 * client views that compose it are step 11. This file exists now because the
 * frame has to exist before the pages that live in it, and because the
 * accessibility and print contracts of the platform are decided by the frame.
 */
export default function ClientPortalLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <ClientPortalShell>{children}</ClientPortalShell>;
}
