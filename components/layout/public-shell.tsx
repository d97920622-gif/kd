// path: components/layout/public-shell.tsx
import { PublicFooter } from '@/components/navigation/public-footer';
import { PublicHeader } from '@/components/navigation/public-header';
import { cn } from '@/lib/utils/cn';

import { MainContent } from './main-content';
import { SkipLink } from './skip-link';

/**
 * PublicShell: the frame every public page is rendered inside.
 *
 * The public pages are the ones a stranger reads before deciding whether to
 * trust the product: the homepage, pricing, the legal pages, the help pages.
 * The shell exists to make one promise to all of them - the reader always
 * knows where the content is, and the page always prints predictably.
 *
 * Structure, in the order it matters:
 *   - The skip link is the first focusable element in the document, before any
 *     chrome, so one Tab followed by Enter reaches the content. This is why
 *     the shells and not the root layout own it: the skip link is only
 *     meaningful when there is chrome to skip past, and chrome belongs to the
 *     shell.
 *   - A column that fills the viewport, so a short page still puts its footer
 *     at the bottom of the screen rather than halfway up it.
 *   - The main landmark, which owns its id and takes focus when the skip link
 *     is used.
 *   - `print-flow` on the wrapper: a screen column becomes a paper flow, with
 *     no viewport height and no padding of its own.
 *
 * The footer arrived in sub-step 1.28, when the public site first had pages a
 * reader could move between: it is `PublicFooter`, which reads the navigation
 * map and renders every live public destination. The shell renders it after the
 * content, so the column's `min-h-dvh` puts a short page's footer at the bottom
 * of the screen rather than halfway up it, and so the contentinfo landmark is
 * outside the main landmark.
 *
 * The header arrived in sub-step 1.29, with the eight pages that finished the
 * public site, and it sits between the skip link and the main landmark: the
 * skip link is still the first focusable element in the document, and the
 * header is the chrome it skips past. It is `PublicHeader`, which reads the
 * navigation map for the same audience the footer reads it for, so the two
 * surfaces cannot disagree about what the site contains or about which page is
 * current.
 *
 * The order of the four elements is the reading order, and each one is there
 * for a reason: the skip link first because a keyboard user should not have to
 * walk the chrome; the header next because a reader who lands on a deep page
 * needs a way up before a way down; the main landmark with its id, which the
 * skip link points at and which owns that string; the footer last, because the
 * legal line and the site's other pages belong after the content.
 */
export interface PublicShellProps {
  readonly children: React.ReactNode;
  /** Layout classes for the page column itself. */
  readonly className?: string;
}

export function PublicShell({ children, className }: PublicShellProps): React.ReactElement {
  return (
    <div
      className="print-flow flex min-h-dvh flex-col bg-background text-foreground"
      data-shell="public"
    >
      <SkipLink />
      <PublicHeader />
      <MainContent className={cn('w-full', className)}>{children}</MainContent>
      <PublicFooter />
    </div>
  );
}
