// path: components/shared/status-state.tsx
import {
  StateIllustration,
  type StateIllustrationKind,
} from '@/components/shared/state-illustration';
import { t, tPlural, type EnglishStringKey } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * StatusState: one shell for the states a page shows when it has no records to
 * show - empty, error, permission and offline.
 *
 * The plan asks for four page states and forbids a blank page; the practical
 * version of that rule is that the four must look like each other, or the
 * product teaches the reader a new layout every time something is missing. So
 * they share one component with one structure:
 *
 *   - an `h2` heading that names the situation, because a state is a section of
 *     the page and not a floating sentence;
 *   - a paragraph that says what to do next, never an apology and never a code;
 *   - a reference line, when there is one to quote (an error to report, a
 *     record that was created);
 *   - one primary action, and at most one secondary.
 *
 * **`role="status"` is not decoration.** Screen readers do not announce content
 * that appears after a page has loaded unless something tells them to, so a
 * state that arrives later - a filter that matched nothing, a retry that failed
 * - is announced only if it introduces itself as a live region. The component
 * takes `live` for exactly that reason: a state that is the whole page does not
 * need it (the reader navigated there), and a state that replaced content
 * always does. `aria-live="assertive"` is used only for errors, because an
 * urgent announcement interrupts whatever the reader was hearing.
 *
 * `aria-labelledby` points at the heading rather than `aria-label` repeating
 * the sentence: the region is named by the words the reader can see, which is
 * what makes the announcement match the screen.
 */
export interface StatusStateAction {
  readonly labelKey: EnglishStringKey;
  readonly onClick?: () => void;
  /** Rendered as a link when set, with the same appearance as a button. */
  readonly href?: string;
  readonly variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export interface StatusStateProps {
  readonly kind: StateIllustrationKind;
  readonly titleKey: EnglishStringKey;
  readonly descriptionKey: EnglishStringKey;
  /** The identifier a support request should quote, when there is one. */
  readonly reference?: string;
  /** A second line of detail under the reference, for the error state. */
  readonly noteKey?: EnglishStringKey;
  readonly primaryAction?: StatusStateAction;
  readonly secondaryAction?: StatusStateAction;
  /** Announce the state when it appears after load. Errors interrupt. */
  readonly live?: 'polite' | 'assertive' | 'off';
  readonly headingId?: string;
  readonly className?: string;
}

/** The countdown and the attempt note are errors only; other states omit them. */
export interface ErrorStateProps {
  /** The code to quote: a correlation id from the server, or a local one. */
  readonly reference?: string;
  readonly titleKey?: EnglishStringKey;
  readonly descriptionKey?: EnglishStringKey;
  /** Attempts so far, shown as a sentence rather than as a counter. */
  readonly attempts?: number;
  readonly onRetry?: () => void;
  readonly onReport?: () => void;
  /** Seconds until the retry control unlocks again, when backoff is waiting. */
  readonly retryAfterSeconds?: number;
  readonly live?: 'polite' | 'assertive' | 'off';
  readonly headingId?: string;
  /** Extra controls the caller adds to the action row: a link home, contact. */
  readonly extra?: React.ReactNode;
  /** Set once the reference has been copied, so the page can say where it went. */
  readonly reportNote?: string;
  readonly className?: string;
}

const ACTION_CLASS =
  'inline-flex min-h-touch items-center justify-center gap-2 rounded-md px-4 text-base font-medium transition-colors duration-fast ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const ACTION_VARIANT_CLASS: Record<NonNullable<StatusStateAction['variant']>, string> = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
};

function StateAction({
  action,
  scope,
}: {
  readonly action: StatusStateAction;
  readonly scope: string;
}): React.ReactElement {
  const className = cn(ACTION_CLASS, ACTION_VARIANT_CLASS[action.variant ?? 'default']);
  if (action.href !== undefined) {
    return (
      <a href={action.href} className={className} data-page-state-action={`${scope}-link`}>
        {t(action.labelKey)}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={className}
      data-page-state-action={scope}
    >
      {t(action.labelKey)}
    </button>
  );
}

export function StatusState({
  kind,
  titleKey,
  descriptionKey,
  reference,
  noteKey,
  primaryAction,
  secondaryAction,
  live = 'polite',
  headingId,
  className,
}: StatusStateProps): React.ReactElement {
  const title = t(titleKey);
  return (
    <section
      // The heading id is the caller's when it has one, because a page may
      // render two states and each region needs its own name.
      aria-labelledby={headingId}
      role={live === 'off' ? undefined : 'status'}
      aria-live={live === 'off' ? undefined : live}
      aria-atomic={live === 'off' ? undefined : true}
      data-page-state={kind}
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground',
        className,
      )}
    >
      <StateIllustration kind={kind} />
      {headingId === undefined ? (
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      ) : (
        <h2 id={headingId} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
      )}
      <p className="max-w-sheet text-base text-muted-foreground">{t(descriptionKey)}</p>

      {reference === undefined ? null : (
        <p className="flex flex-wrap items-baseline gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{t('states.label_error_correlation')}</span>
          <code
            className="wrap-anywhere rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs"
            data-page-state-reference={kind}
          >
            {reference}
          </code>
        </p>
      )}

      {noteKey === undefined ? null : <p className="text-sm text-muted-foreground">{t(noteKey)}</p>}

      {primaryAction === undefined && secondaryAction === undefined ? null : (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {primaryAction === undefined ? null : (
            <StateAction action={primaryAction} scope={`${kind}-primary`} />
          )}
          {secondaryAction === undefined ? null : (
            <StateAction
              action={{ variant: 'outline', ...secondaryAction }}
              scope={`${kind}-secondary`}
            />
          )}
        </div>
      )}
    </section>
  );
}

/**
 * ErrorState: the error member of the family, with the two things an error
 * needs and the other states do not.
 *
 * The reference line is the whole reason a reader can get help: "it did not
 * work" is unactionable, and a support request that quotes `ref-...` points at
 * one request in the logs. The attempts line is the other half - a reader who
 * has pressed retry twice wants to know the product knows.
 *
 * The retry control disables itself while a backoff is waiting and counts down
 * in the button's own text, so the waiting is visible where the reader is
 * looking rather than in a sentence somewhere else. Retrying immediately after
 * a failure is how a small outage becomes a load spike.
 */
export function ErrorState({
  reference,
  titleKey = 'states.label_error_title',
  descriptionKey = 'states.label_error_description',
  attempts,
  onRetry,
  onReport,
  retryAfterSeconds,
  live = 'assertive',
  headingId,
  extra,
  reportNote,
  className,
}: ErrorStateProps): React.ReactElement {
  const waiting = retryAfterSeconds !== undefined && retryAfterSeconds > 0;
  return (
    <section
      aria-labelledby={headingId}
      role={live === 'off' ? undefined : 'status'}
      aria-live={live === 'off' ? undefined : live}
      aria-atomic={live === 'off' ? undefined : true}
      data-page-state="error"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-6 text-card-foreground',
        className,
      )}
    >
      <StateIllustration kind="error" />
      <h2 id={headingId} className="text-xl font-semibold tracking-tight">
        {t(titleKey)}
      </h2>
      <p className="max-w-sheet text-base text-muted-foreground">{t(descriptionKey)}</p>

      {reference === undefined ? null : (
        <p className="flex flex-wrap items-baseline gap-2 text-sm text-muted-foreground">
          <span className="font-medium">{t('states.label_error_correlation')}</span>
          <code
            className="wrap-anywhere rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs"
            data-page-state-reference="error"
          >
            {reference}
          </code>
        </p>
      )}
      {reference === undefined ? null : (
        <p className="max-w-sheet text-sm text-muted-foreground">
          {t('states.label_error_correlation_hint')}
        </p>
      )}

      {attempts === undefined || attempts < 1 ? null : (
        <p className="text-sm text-muted-foreground" data-page-state-attempts={attempts}>
          {tPlural('states.label_error_attempts', attempts)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="button"
          onClick={onRetry}
          disabled={waiting || onRetry === undefined}
          data-page-state-retry="true"
          aria-disabled={waiting || onRetry === undefined}
          className={cn(ACTION_CLASS, ACTION_VARIANT_CLASS.default, 'disabled:opacity-50')}
        >
          {waiting
            ? tPlural('states.label_error_retry_wait', retryAfterSeconds)
            : t('states.action_retry')}
        </button>
        {onReport === undefined ? null : (
          <button
            type="button"
            onClick={onReport}
            data-page-state-report="true"
            className={cn(ACTION_CLASS, ACTION_VARIANT_CLASS.outline)}
          >
            {t('states.action_report')}
          </button>
        )}
        {extra}
      </div>

      {reportNote === undefined ? null : (
        <p className="max-w-sheet text-sm text-muted-foreground" data-page-state-reported="true">
          {reportNote}
        </p>
      )}
    </section>
  );
}
