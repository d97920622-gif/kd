// path: components/shared/live-region.tsx
'use client';

import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * LiveRegion: the one place a screen reader is told that something changed.
 *
 * Assistive technology does not announce content that appears after a page has
 * loaded unless the content arrives inside a live region that was already
 * there. That is the whole requirement (MASTER_PROMPT: aria-live for form
 * errors), and it has two consequences that are easy to get wrong:
 *
 *   1. **The region must exist before the message does.** A region that is
 *      mounted together with its text is announced inconsistently across
 *      screen readers, because the region is new rather than changed. This
 *      component therefore always renders its element, and a message that is
 *      `null` leaves it empty. An empty live region is silent by definition.
 *   2. **The politeness is a decision, not a default.** `assertive` interrupts
 *      whatever the reader is hearing, which is right for a failed save and
 *      wrong for "3 results"; `polite` waits for a pause, which is right for
 *      everything that can wait. The component takes the level and defaults to
 *      polite, because interrupting is the exception.
 *
 * `role="status"` and `role="alert"` are set from the level: they are the
 * implicit-live-region roles, and setting both a role and the attribute makes
 * the intent readable in the markup - `role="alert"` for the reader who relies
 * on the role, `aria-live="assertive"` for the reader who relies on the
 * attribute. The announcement is `aria-atomic`, so the whole sentence is read
 * rather than only the changed word, which is what "1 of 4 results" needs.
 *
 * The message may be passed as a catalogue key or as text the caller has
 * already built - a count, a saved record's name - because both are real, and a
 * caller that has a sentence of its own should not have to add a catalogue key
 * to say it.
 */
export interface LiveRegionProps {
  readonly message: string | null;
  readonly messageKey?: EnglishStringKey;
  readonly level?: 'polite' | 'assertive';
  readonly className?: string;
}

export function LiveRegion({
  message,
  messageKey,
  level = 'polite',
  className,
}: LiveRegionProps): React.ReactElement {
  const text = messageKey === undefined ? message : t(messageKey);
  return (
    <div
      role={level === 'assertive' ? 'alert' : 'status'}
      aria-live={level}
      aria-atomic="true"
      data-live-region={level}
      className={cn('sr-only', className)}
    >
      {text ?? ''}
    </div>
  );
}
