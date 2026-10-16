// path: components/layout/public-shell.tsx
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
 * What is deliberately not here. The header, the navigation and the footer
 * arrive with the layout components in the next sub-step, and the shell is
 * built to receive them without changing: the skip link is already first, the
 * landmarks are already in the right order, and the printable region is
 * already marked. Nothing about those components will need to move the focus
 * order around, which is the mistake this file exists to prevent.
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
    </div>
  );
}
