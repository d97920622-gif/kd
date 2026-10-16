// path: app/(public)/layout.tsx
import { PublicShell } from '@/components/layout/public-shell';

import '../../styles/print.css';

/**
 * The public route group.
 *
 * Every page under `app/(public)` is rendered inside PublicShell, and the
 * group carries the print base as well: a page that prints is a public page,
 * because the pages that get printed are the ones a reader is allowed to keep.
 * The stylesheet is imported here rather than in the root layout so the
 * application shell (which is never printed to paper) does not pay for rules
 * it will not use; sub-step 1.30 owns moving it to the root when the whole
 * platform gains document printing.
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
