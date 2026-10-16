// path: components/layout/skip-link.tsx
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

import { MAIN_CONTENT_ID } from './main-content';

/**
 * SkipLink: the first focusable element on the page, and the reason a keyboard
 * user does not have to walk the navigation to reach the content.
 *
 * A header with a logo, a menu, a search field, a language switch and a profile
 * menu can be thirty tab stops before the first line of the document. For a
 * keyboard user that cost is paid on every page, and for a screen reader user
 * the landmark list is a shortcut that only helps if they know it exists. The
 * skip link is the shortcut that needs no knowledge: it is the first thing Tab
 * reaches, it says where it goes, and one Enter puts focus in the main
 * landmark.
 *
 * Design decisions:
 *   - Visually hidden until focused, never removed: the link must be the first
 *     tab stop even when it is not painted. It appears over the page corner
 *     when focused, on a surface and a ring from the token set, at the 44px
 *     touch height, so it stays usable if it is tapped rather than tabbed to.
 *   - The label comes from the catalogue (common.label_skip_to_content), so
 *     the same words are translated everywhere they appear.
 *   - The target id comes from MAIN_CONTENT_ID, which the landmark itself
 *     declares. One string, two readers, no drift.
 *   - It is a link, not a button: the browser's fragment navigation moves the
 *     viewport and the focus together, and it works without JavaScript.
 */
export interface SkipLinkProps {
  /** Text of the link. Defaults to the catalogue entry. */
  readonly label?: string;
  /** Optional layout classes, for a shell that positions its own chrome. */
  readonly className?: string;
}

export function SkipLink({ label, className }: SkipLinkProps): React.ReactElement {
  const text = label ?? t('common.label_skip_to_content');

  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className={cn(
        'sr-only focus:not-sr-only',
        'focus:absolute focus:left-gutter focus:top-gutter focus:z-toast',
        'focus:inline-flex focus:min-h-touch focus:items-center focus:rounded-md',
        'focus:bg-background focus:px-4 focus:text-base focus:font-medium focus:text-foreground',
        'focus:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      data-print="hide"
    >
      {text}
    </a>
  );
}
