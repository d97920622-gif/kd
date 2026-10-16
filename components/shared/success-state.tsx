// path: components/shared/success-state.tsx
'use client';

import { CheckCircle2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { t, tPlural, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * SuccessState: what a reader sees after a change lands, and the countdown that
 * takes them to the next page.
 *
 * A success screen has one job: confirm that the change is real, and get out of
 * the way. Three rules follow from it.
 *
 *   1. **The confirmation is quiet and countable.** A tick, a heading, one
 *      sentence and - when the record is worth quoting later - the reference the
 *      reader can search for. No animation, no celebration, no second
 *      instruction: this is not a milestone, and celebration belongs to the
 *      sub-step that owns milestones.
 *   2. **A redirect is announced and interruptible.** A page that navigates
 *      three seconds after it appears takes a decision away from a reader who is
 *      slow, distracted or using a screen reader. So the countdown is visible
 *      text in a polite live region that counts down once per second, and there
 *      is always a control to continue now and a control to stay. The countdown
 *      also pauses while the reader is inside the panel - pointer or keyboard
 *      focus - because a page that vanishes while being read is the failure the
 *      rule exists to prevent.
 *   3. **The reader can always stop it.** "Stay on this page" cancels the
 *      redirect for good; the caller keeps whatever it renders beside the
 *      countdown, so a success screen with nowhere to go is just the panel.
 *
 * The component owns a timer and nothing else: no routing, no fetching. When
 * the countdown finishes, or when the reader asks to continue, it calls
 * `onComplete`, and the caller decides what that means.
 */
export interface SuccessStateProps {
  /** Reference of the record that was created or changed, when there is one. */
  readonly reference?: string;
  readonly titleKey?: EnglishStringKey;
  readonly descriptionKey?: EnglishStringKey;
  /** Seconds before `onComplete` runs. Omitted means no countdown at all. */
  readonly redirectSeconds?: number;
  readonly onComplete?: () => void;
  /** Extra controls the caller adds beside the countdown, such as a link. */
  readonly children?: React.ReactNode;
  readonly className?: string;
}

const DEFAULT_TITLE: EnglishStringKey = 'states.label_success_title';
const DEFAULT_DESCRIPTION: EnglishStringKey = 'states.label_success_description';

const CONTROLS = 'flex flex-wrap items-center gap-3 pt-1';
const CONTROL =
  'inline-flex min-h-touch items-center justify-center rounded-md px-4 text-base font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

export function SuccessState({
  reference,
  titleKey = DEFAULT_TITLE,
  descriptionKey = DEFAULT_DESCRIPTION,
  redirectSeconds,
  onComplete,
  children,
  className,
}: SuccessStateProps): React.ReactElement {
  const hasCountdown = redirectSeconds !== undefined && redirectSeconds > 0;
  const [remaining, setRemaining] = useState(redirectSeconds ?? 0);
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [finished, setFinished] = useState(false);

  const complete = useCallback(() => {
    setFinished(true);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!hasCountdown || cancelled || paused || finished) {
      return;
    }
    if (remaining <= 0) {
      complete();
      return;
    }
    const timer = window.setTimeout(() => {
      setRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [hasCountdown, cancelled, paused, finished, remaining, complete]);

  const counting = hasCountdown && !cancelled && !finished;

  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-page-state="success"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground',
        className,
      )}
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(false);
      }}
      onFocusCapture={() => {
        setPaused(true);
      }}
      onBlurCapture={() => {
        setPaused(false);
      }}
    >
      <CheckCircle2 aria-hidden="true" className="size-8 text-success" />
      <h2 className="text-xl font-semibold tracking-tight">{t(titleKey)}</h2>
      <p className="max-w-sheet text-base text-muted-foreground">{t(descriptionKey)}</p>

      {reference === undefined ? null : (
        <p className="flex flex-wrap items-baseline gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{t('states.label_success_reference')}</span>
          <code
            className="wrap-anywhere rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs"
            data-page-state-reference="success"
          >
            {reference}
          </code>
        </p>
      )}

      {counting ? (
        <p className="text-sm text-muted-foreground" data-page-state-countdown={remaining}>
          {tPlural('states.label_success_redirect', remaining)}
        </p>
      ) : null}

      {children === undefined ? null : <div className={CONTROLS}>{children}</div>}

      {counting ? (
        <div className={CONTROLS}>
          <button
            type="button"
            className={cn(CONTROL, 'bg-primary text-primary-foreground hover:bg-primary/90')}
            data-page-state-continue="true"
            onClick={complete}
          >
            {t('states.action_success_continue')}
          </button>
          <button
            type="button"
            className={cn(CONTROL, 'border border-input bg-background hover:bg-accent')}
            data-page-state-stay="true"
            onClick={() => {
              setCancelled(true);
            }}
          >
            {t('states.action_success_stay')}
          </button>
        </div>
      ) : null}
    </section>
  );
}
