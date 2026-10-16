// path: app/(auth)/layout.tsx
import { AuthShell } from '@/components/layout/auth-shell';

import '../../styles/print.css';

/**
 * The auth route group: sign in, sign up, password recovery, verification.
 *
 * The group is separate from the public group on purpose. The pages inside it
 * share a different contract with the reader than a marketing page does: one
 * task, no navigation away from it, and a panel the reader can complete
 * without deciding anything else. Keeping them in their own group means the
 * difference is structural rather than a condition inside one layout, and no
 * public page can accidentally inherit the stripped-down frame.
 *
 * The print base is imported here for the same reason as in the public group:
 * a reader who prints a page they cannot act on should still get a readable
 * sheet rather than a screenshot of a form.
 */
export default function AuthLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return <AuthShell>{children}</AuthShell>;
}
