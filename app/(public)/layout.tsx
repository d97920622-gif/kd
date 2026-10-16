// path: app/(public)/layout.tsx
import { PublicShell } from '@/components/layout/public-shell';

/**
 * The public route group.
 *
 * Every page under `app/(public)` is rendered inside PublicShell. The print
 * base is not imported here: it is loaded once at the root, for every group,
 * because every group has something a reader may need on paper - an invoice,
 * a receipt, a pricing page - and a group that has to remember to import it is
 * a group that will one day forget.
 *
 * The group adds no URL segment of its own, so the pages inside it keep the
 * paths the public site already promises.
 */
export default function PublicLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <PublicShell>{children}</PublicShell>;
}
