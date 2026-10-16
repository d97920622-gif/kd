// path: components/layout/main-content.tsx
import { cn } from '@/lib/utils/cn';

/**
 * The main landmark, and the single owner of its id.
 *
 * Two things depend on this element and they must never disagree: the skip
 * link, which points at this id, and the focus order, which starts in here
 * after the link is used. Both read MAIN_CONTENT_ID from this module rather
 * than repeating the string, so renaming the landmark is one edit, and
 * scripts/checks/layout-shells.mjs fails the build if the id in the rendered
 * markup and the href of the skip link drift apart.
 *
 * Why tabIndex={-1}: a skip link changes the browser's fragment target, and an
 * element without a tabindex is not focusable, so focus would stay on the link
 * and the next Tab would continue through the header it was meant to skip.
 * tabIndex={-1} makes the landmark programmatically focusable while keeping it
 * out of the tab order.
 *
 * Why the outline is suppressed: focus is moved here by code, and an outline
 * drawn around an entire region of the page reads as a rendering fault rather
 * than as a focus indicator. The landmark is not interactive; the focus ring a
 * reader needs is the one on the skip link, which the link itself draws.
 */
export const MAIN_CONTENT_ID = 'main-content';

export interface MainContentProps {
  readonly children: React.ReactNode;
  /** Layout classes. The landmark itself owns no spacing beyond its role. */
  readonly className?: string;
}

export function MainContent({ children, className }: MainContentProps): React.ReactElement {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className={cn('flex-1 focus:outline-none', className)}>
      {children}
    </main>
  );
}
