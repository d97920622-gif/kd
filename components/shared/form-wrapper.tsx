// path: components/shared/form-wrapper.tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

import { FormErrorSummary } from '@/components/shared/form-error-summary';
import { SubmitButton } from '@/components/shared/submit-button';
import { CSRF_TOKEN_HEADER, useOneTimeCsrfToken } from '@/lib/forms/csrf-token';
import {
  applyServerFieldErrors,
  readSubmissionOutcome,
  type SubmissionDetail,
} from '@/lib/forms/form-submission';
import { useMappedFormErrors, type FormFieldDescriptor } from '@/lib/forms/use-mapped-form-errors';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/utils/cn';

/**
 * FormWrapper: the frame every form on the platform sits in.
 *
 * A form has four states, and this component owns all four so no feature has
 * to invent them again:
 *
 *   idle        the user is filling the form in
 *   submitting  a submission is in flight; every control is locked and the
 *               submit button shows its pending label
 *   error       the submission was refused. Two kinds, and the difference
 *               matters to the user: validation (the entries need fixing, so
 *               the field messages and the summary are shown) and request
 *               (the entries are fine, the request did not complete, so a
 *               frame explains what to do next)
 *   success     the server accepted the submission; the confirmation frame is
 *               shown and the feature's next step is offered
 *
 * The rules it enforces, in the order they matter:
 *
 *   1. One submission per intent. The submit button is disabled and the
 *      controls sit in a disabled fieldset while a submission runs, and a
 *      submit lock refuses a second submission that arrives from a double
 *      click, a double tap or an Enter key held down. The server refuses a
 *      repeated submission as well; this layer exists so the user never has to
 *      find out.
 *   2. Every submission carries a one-time token (MASTER_PROMPT item 11). The
 *      token is spent as the request leaves and replaced from the response, so
 *      a replayed request carries a spent token and is rejected
 *      (lib/forms/csrf-token.ts holds the client half, lib/middleware/csrf.ts
 *      the server half).
 *   3. Errors are announced. Field messages and the summary are live regions,
 *      the summary takes focus when a submission is refused, and every entry
 *      in it is a link to the field it describes.
 *   4. A failure never loses the user's work. Values stay on screen after a
 *      refused submission, and the recovery action is a sentence, not a
 *      number.
 *
 * The wrapper does not perform the request. The feature passes `onSubmit`,
 * which is where the fetch, the endpoint and the audit trail live; the wrapper
 * gives it the values and the token and interprets the answer.
 */

/**
 * Headers a submission sends, so every endpoint sees the same three and the
 * token travels where the server can read it.
 */
export function submissionHeaders(csrfToken: string): Record<string, string> {
  return {
    'content-type': 'application/json',
    accept: 'application/json',
    [CSRF_TOKEN_HEADER]: csrfToken,
  };
}

export type FormState = 'idle' | 'submitting' | 'error' | 'success';

/** What the error state is caused by; the fix is different in each case. */
export type FormErrorKind = 'validation' | 'request' | 'token' | null;

/** A frame: heading, explanation and the action the user takes next. */
export interface FormFrame {
  readonly title: string;
  readonly message: string;
  readonly action: string;
}

export interface FormSubmission {
  /** Values as the form holds them; money stays a string. */
  readonly values: Record<string, unknown>;
  /** The one-time token this submission spends. */
  readonly csrfToken: string;
}

export interface FormWrapperProps {
  /** The form object from `useZodForm`. */
  readonly form: UseFormReturn<FieldValues>;
  /** Fields to report, in the order they appear on screen. */
  readonly fields: readonly FormFieldDescriptor[];
  /** One-time token minted by the server render. */
  readonly csrfToken: string;
  /** Label of the submit button when the form is idle. */
  readonly submitLabel: string;
  /** Label of the submit button while the submission runs. */
  readonly pendingLabel: string;
  /**
   * Performs the submission and returns the response body. Throwing from here
   * is treated as a request failure: the entries stay, the frame explains.
   */
  readonly onSubmit: (submission: FormSubmission) => Promise<unknown>;
  /** Called after a successful submission, for redirects and side effects. */
  readonly onSubmitted?: (outcome: { data: unknown; correlationId: string | null }) => void;
  /** Replaces the default frame for a failure code, keyed by `code`. */
  readonly frameForCode?: (code: string) => FormFrame | null;
  /** Extra content shown with the confirmation, for example a link onwards. */
  readonly successContent?: React.ReactNode;
  /** Hides the controls once the submission succeeded. */
  readonly collapseOnSuccess?: boolean;
  /** Locks the form from outside, for a record that cannot be edited. */
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly className?: string;
}

/** Frame shown when the browser has no connection at all. */
function offlineFrame(): FormFrame {
  return {
    title: t('errors.offline_frame_title'),
    message: t('errors.offline_frame_message'),
    action: t('errors.offline_frame_action'),
  };
}

/** Frame for a request that failed without a usable answer from the server. */
function requestFrame(): FormFrame {
  return {
    title: t('errors.internal_error_frame_title'),
    message: t('errors.internal_error_frame_message'),
    action: t('errors.internal_error_frame_action'),
  };
}

/** Frame for a submission refused because the one-time token was not usable. */
function tokenFrame(): FormFrame {
  return {
    title: t('forms.token_frame_title'),
    message: t('forms.token_frame_message'),
    action: t('forms.token_frame_action'),
  };
}

/** Frame for entries the server refused to accept. */
function validationFrame(): FormFrame {
  return {
    title: t('errors.validation_failed_frame_title'),
    message: t('errors.validation_failed_frame_message'),
    action: t('errors.validation_failed_frame_action'),
  };
}

/** Frame for a submission that succeeded. */
function successFrame(): FormFrame {
  return {
    title: t('common.state_success_title'),
    message: t('common.state_success_message'),
    action: t('common.action_continue'),
  };
}

export function FormWrapper({
  form,
  fields,
  csrfToken,
  submitLabel,
  pendingLabel,
  onSubmit,
  onSubmitted,
  frameForCode,
  successContent,
  collapseOnSuccess = false,
  disabled = false,
  children,
  className,
}: FormWrapperProps): React.ReactElement {
  const [state, setState] = useState<FormState>('idle');
  const [errorKind, setErrorKind] = useState<FormErrorKind>(null);
  const [frame, setFrame] = useState<FormFrame | null>(null);
  const [correlationId, setCorrelationId] = useState<string | null>(null);
  const [formLevelDetails, setFormLevelDetails] = useState<readonly SubmissionDetail[]>([]);
  const submitLock = useRef(false);
  const token = useOneTimeCsrfToken(csrfToken);
  const mapped = useMappedFormErrors({ control: form.control, fields });

  const isSubmitting = state === 'submitting';
  const isLocked = disabled || isSubmitting;

  const handleSubmission = useCallback(
    async (values: Record<string, unknown>): Promise<void> => {
      if (submitLock.current) {
        return;
      }
      submitLock.current = true;
      const spent = token.spendToken();
      if (spent === '') {
        setErrorKind('token');
        setFrame(tokenFrame());
        setState('error');
        submitLock.current = false;
        return;
      }

      setState('submitting');
      setFrame(null);
      setCorrelationId(null);
      setFormLevelDetails([]);

      try {
        const payload = await onSubmit({ values, csrfToken: spent });
        const outcome = readSubmissionOutcome(payload);
        const rotated = token.installFromResponse({ payload });

        if (outcome.kind === 'failure') {
          const applied = applyServerFieldErrors(form, outcome.details, fields);
          setCorrelationId(outcome.correlationId);
          setFormLevelDetails(applied.formLevel);
          setErrorKind('request');
          setFrame(frameForCode?.(outcome.code) ?? null);
          setState('error');
          return;
        }

        if (outcome.kind === 'unknown' || !rotated) {
          // Either the body is not an envelope this platform produces or the
          // response carried no replacement token. Both leave the form unable
          // to submit again safely, so the next step is a reload.
          setErrorKind('token');
          setFrame(tokenFrame());
          setState('error');
          return;
        }

        setState('success');
        setFrame(successFrame());
        setCorrelationId(outcome.correlationId);
        onSubmitted?.({ data: outcome.data, correlationId: outcome.correlationId });
      } catch {
        setErrorKind('request');
        setFrame(
          typeof navigator !== 'undefined' && !navigator.onLine ? offlineFrame() : requestFrame(),
        );
        setState('error');
      } finally {
        submitLock.current = false;
      }
    },
    [fields, form, frameForCode, onSubmit, onSubmitted, token],
  );

  const submitHandler = form.handleSubmit(
    async (values) => {
      await handleSubmission(values);
    },
    () => {
      // The client refused the entries before any request left the browser.
      setErrorKind('validation');
      setFrame(validationFrame());
      setState('error');
    },
  );

  const activeFrame = frame ?? (errorKind === 'validation' ? validationFrame() : null);
  const showControls = !(collapseOnSuccess && state === 'success');

  return (
    <form
      noValidate
      className={cn('grid gap-4', className)}
      onSubmit={(event) => {
        void submitHandler(event);
      }}
    >
      <FormErrorSummary items={mapped.summaryItems} containerRef={mapped.summaryRef} />

      {state === 'error' && errorKind !== 'validation' && activeFrame !== null ? (
        <div role="alert" className="grid gap-1 rounded-md border border-destructive p-4">
          <p className="text-sm font-semibold text-destructive">{activeFrame.title}</p>
          <p className="text-sm text-foreground">{activeFrame.message}</p>
          <p className="text-sm text-muted-foreground">{activeFrame.action}</p>
          {formLevelDetails.length > 0 ? (
            <ul className="grid gap-1">
              {formLevelDetails.map((detail) => (
                <li key={detail.message} className="text-sm text-destructive">
                  {detail.message}
                </li>
              ))}
            </ul>
          ) : null}
          {correlationId === null ? null : (
            <p className="text-sm text-muted-foreground">{correlationId}</p>
          )}
        </div>
      ) : null}

      {state === 'success' && activeFrame !== null ? (
        <div role="status" className="grid gap-1 rounded-md border border-success p-4">
          <p className="text-sm font-semibold text-success">{activeFrame.title}</p>
          <p className="text-sm text-foreground">{activeFrame.message}</p>
          {successContent}
        </div>
      ) : null}

      {/* The pending status lives in a region that is always in the document,
          so a screen reader announces the change instead of missing a region
          that appears late. The error and success frames carry their own
          alert and status roles and are announced where they appear. */}
      <p role="status" aria-live="polite" className="sr-only">
        {isSubmitting ? pendingLabel : ''}
      </p>

      {showControls ? (
        <fieldset
          disabled={isLocked}
          aria-busy={isSubmitting}
          className={cn('grid gap-4 border-0 p-0', isLocked && 'opacity-60')}
        >
          {children}
        </fieldset>
      ) : null}

      <SubmitButton
        label={submitLabel}
        pendingLabel={pendingLabel}
        isSubmitting={isSubmitting}
        disabled={disabled || !token.hasToken}
      />
    </form>
  );
}
