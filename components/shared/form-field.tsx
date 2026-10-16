// path: components/shared/form-field.tsx
'use client';

import { cloneElement, useId } from 'react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

/**
 * FormField: label, control, description and error message wired together.
 *
 * The wiring is the point of this component. A field that looks correct but
 * describes nothing is unusable with a screen reader, so FormField
 * guarantees, for every control it wraps:
 *
 *   - the control has an id, generated when the caller does not supply one;
 *   - the label points at that id, so clicking the label focuses the control;
 *   - the description and the error message are referenced by
 *     aria-describedby, so they are read after the label and after the value;
 *   - aria-invalid is set exactly when the control is invalid;
 *   - the error message is a live region, so it is announced when it appears
 *     rather than only when the user navigates back to the field.
 *
 * The error message replaces the description rather than stacking above it:
 * showing a hint and an error about the same field at once makes the field
 * taller exactly when the user needs it calm, and the hint is the less urgent
 * of the two.
 *
 * A required field carries a visible required marker and the control carries
 * the required attribute, but no field relies on colour alone: the marker is
 * text, and the error is a sentence.
 *
 * The label, description and error text all come from the string catalogue.
 *
 * A form that has to name a field in more than one place (the control here,
 * the descriptor list the error summary is built from) passes the same id to
 * both; `fieldIdFor(path)` in lib/forms/field-id.ts derives it from the field
 * path so the two cannot drift apart.
 */
export interface FormFieldProps {
  /** Visible label for the control. */
  readonly label: string;
  /** One line explaining what to enter; hidden while an error is shown. */
  readonly description?: string;
  /** Error message for this field, already translated. */
  readonly error?: string;
  /** Marks the field as required in the label and on the control. */
  readonly required?: boolean;
  /** Explicit control id; one is generated when omitted. */
  readonly fieldId?: string;
  /** The control. Receives id, aria-describedby, aria-invalid and required. */
  readonly children: React.ReactElement<FormFieldControlProps>;
  readonly className?: string;
}

/** What a control receives from FormField. Every control in components/ui accepts it. */
export interface FormFieldControlProps {
  readonly id?: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: boolean;
  readonly required?: boolean;
}

export function FormField({
  label,
  description,
  error,
  required = false,
  fieldId,
  children,
  className,
}: FormFieldProps): React.ReactElement {
  const generatedId = useId();
  // The generated id is reduced to characters that are safe in a CSS selector
  // and in a URL fragment, because the error summary links to this id.
  const controlId = fieldId ?? `field-${generatedId.replace(/[^A-Za-z0-9_-]/g, '-')}`;
  const descriptionId = `${controlId}-description`;
  const errorId = `${controlId}-error`;
  const hasError = typeof error === 'string' && error.length > 0;

  const describedBy = hasError ? errorId : description === undefined ? undefined : descriptionId;

  const control = cloneElement(children, {
    id: controlId,
    'aria-describedby': describedBy,
    'aria-invalid': hasError ? true : undefined,
    required,
  });

  return (
    <div className={cn('grid gap-2', className)}>
      <Label htmlFor={controlId}>
        {label}
        {required ? <RequiredMarker /> : null}
      </Label>
      {control}
      {hasError ? (
        <p id={errorId} role="alert" aria-live="polite" className="text-sm text-destructive">
          {error}
        </p>
      ) : description === undefined ? null : (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

/**
 * Required marker. It is a separate element so it can carry its own spacing
 * and so the screen reader user is not read the word "required" twice: the
 * control already carries the required attribute, so this marker is hidden
 * from assistive technology and exists for sighted users only.
 */
function RequiredMarker(): React.ReactElement {
  return (
    <span aria-hidden="true" className="ml-1 text-destructive">
      {'*'}
    </span>
  );
}
