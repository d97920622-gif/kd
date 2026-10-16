// path: components/layout/public-shell.tsx
import { PublicFooter } from '@/components/navigation/public-footer';
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
 * What is still not here is the header. A public header is navigation chrome
 * with a nav landmark and its own touch-target rules, and it belongs with the
 * rest of the public routes in sub-step 1.29 rather than being invented for
 * four pages and then rewritten for twelve. Until then the footer and the
 * in-page calls to action are how a reader moves around the site, which is why
 * no page depends on a header existing.
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
      <MainContent className={cn('w-full', className)}>{children}</MainContent>
      <PublicFooter />
    </div>
  );
}
