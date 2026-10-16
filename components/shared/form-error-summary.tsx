// path: components/shared/form-error-summary.tsx
'use client';

import { tPlural } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * FormErrorSummary: what went wrong, at the top of the form, in one place.
 *
 * A form that only marks fields red leaves a keyboard user hunting for the
 * problem: they submit, nothing appears to happen, and the first error may be
 * three screens above where focus sits. The summary solves that by appearing
 * above the form, taking focus when a submission is rejected, and listing
 * every invalid field as a link that moves focus straight to it.
 *
 * Why an alert and a live region:
 *   - role="alert" makes the summary interrupt politely and be read as a
 *     whole when it appears;
 *   - aria-live="assertive" is left to role="alert" rather than set by hand,
 *     because setting both is redundant and some readers announce twice;
 *   - tabIndex={-1} makes the container focusable by code, so focus can move
 *     to it without adding a control the tab order has to pass through.
 *
 * The count is a plural pair from the catalogue, so the headline reads
 * correctly for one field and for several, and the items are the same
 * sentences shown next to the fields: one source, no drift between the
 * summary and the inline message.
 */
export interface FormErrorSummaryItem {
  /** Control id the item links to, so focus lands on the offending field. */
  readonly fieldId: string;
  /** Label of the field, translated. */
  readonly label: string;
  /** Message shown next to the field, translated. */
  readonly message: string;
}

export interface FormErrorSummaryProps {
  readonly items: readonly FormErrorSummaryItem[];
  /** Receives the container element so the caller can move focus to it. */
  readonly containerRef?: React.Ref<HTMLDivElement>;
  readonly className?: string;
}

export function FormErrorSummary({
  items,
  containerRef,
  className,
}: FormErrorSummaryProps): React.ReactElement | null {
  if (items.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className={cn(
        'grid gap-2 rounded-md border border-destructive bg-destructive/10 p-4 text-destructive outline-none',
        className,
      )}
    >
      <p className="text-sm font-semibold">{tPlural('forms.error_summary_title', items.length)}</p>
      <ul className="grid gap-1">
        {items.map((item) => (
          <li key={item.fieldId} className="text-sm">
            <a
              href={`#${item.fieldId}`}
              className="underline underline-offset-1"
              onClick={() => {
                // The hash already updates the address, but focus does not
                // follow a hash change on every browser, and focus is the
                // point of the summary.
                const target = document.getElementById(item.fieldId);
                if (target !== null) {
                  target.focus();
                }
              }}
            >
              {item.label}
            </a>
            <span className="ml-1">{item.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
