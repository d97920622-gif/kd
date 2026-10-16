// path: components/layout/sticky-action-bar.tsx
import { t, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * StickyActionBar: the save button stays where the reader is.
 *
 * The longest forms in this product - a client record, an invoice with line
 * items, a payout run - are taller than a laptop viewport and much taller than
 * a phone. A save button at the end of such a form is a button the reader has
 * to scroll to find, and the second half of the form is where they lose track
 * of whether their work is saved. So the actions stick to the bottom of the
 * viewport while the form scrolls behind them.
 *
 * Four decisions:
 *
 *   - **Sticky, not fixed.** The bar is the last child of the form column and
 *     sticks within it. It therefore cannot float over a page that has no
 *     actions, cannot cover the footer, and needs no magic bottom padding on
 *     the content to avoid hiding the last row. A fixed bar always needs that
 *     padding, and the day the bar grows a second row the last row of the form
 *     is unreachable.
 *   - **The device inset is padding, from the token.** On a phone with a home
 *     indicator, a bottom-pinned control sits in the reserved band unless the
 *     inset is added. The value is the browser's own report through
 *     `--safe-bottom`, zero where the device reserves nothing.
 *   - **The summary slot is text, the actions slot is controls.** An invoice
 *     form's bar shows the total due beside Save, so the reader confirms the
 *     number they are about to commit. Money is rendered by the caller through
 *     the money formatter - this component never formats or computes a number.
 *   - **A labelled group, and hidden in print.** The bar is a `group` with an
 *     accessible name, so the reader can jump to it and knows what the controls
 *     belong to; and a printed form does not need a Save button it cannot press.
 *
 * The bar is the form's submit surface, so the buttons inside it are expected
 * to be real `submit` buttons in the caller: this component owns the surface,
 * not the submission.
 */
export interface StickyActionBarProps {
  /** The action controls: submit, cancel, secondary actions. */
  readonly children: React.ReactNode;
  /** Optional summary text rendered before the controls, such as a total. */
  readonly summary?: React.ReactNode;
  /** Accessible name of the group. */
  readonly labelKey?: EnglishStringKey;
  readonly className?: string;
}

export function StickyActionBar({
  children,
  summary,
  labelKey = 'shells.label_action_bar_heading',
  className,
}: StickyActionBarProps): React.ReactElement {
  return (
    <div
      role="group"
      aria-label={t(labelKey)}
      data-layout="sticky-action-bar"
      data-print="hide"
      className={cn(
        // One padding declaration, not two competing ones: the inset is added
        // to the bar's own bottom padding, so the controls keep their spacing
        // on a device that reserves nothing and clear the home indicator on a
        // device that reserves the band.
        'sticky bottom-0 z-sticky flex flex-col gap-3 border-t border-border bg-card pb-[calc(var(--safe-bottom)+12px)] pt-3 text-card-foreground sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      {summary === undefined ? null : (
        <div className="text-sm text-muted-foreground">{summary}</div>
      )}
      <div className="flex flex-wrap items-center gap-3 sm:justify-end">{children}</div>
    </div>
  );
}
