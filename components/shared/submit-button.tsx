// path: components/shared/submit-button.tsx
'use client';

import { Loader2 } from 'lucide-react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

/**
 * SubmitButton: the one control that starts a form submission.
 *
 * It exists because three rules have to hold together on every form, and a
 * plain button cannot hold them:
 *
 *   1. Disabled while the submission runs. This is the double-submit guard the
 *      specification requires: a second click, a double tap, or an impatient
 *      press of the Enter key cannot start a second submission. Disabling the
 *      button is the visible half; FormWrapper also refuses a second submit
 *      that arrives while one is running.
 *   2. Busy is announced. aria-busy tells assistive technology that the
 *      control is working, and the label swaps through a polite live region,
 *      so a screen reader user hears that the submission started instead of
 *      being left on a frozen interface.
 *   3. The pending label says what is happening. "Saving" is information;
 *      a disabled button with an unchanged label reads as broken.
 *
 * The spinner is decorative and hidden from assistive technology: the label
 * carries the meaning, and a screen reader should not hear an animation.
 * Under reduced motion the spin collapses to a static icon with no layout
 * change, because the duration tokens zero out inside the reduced motion
 * block in styles/globals.css.
 *
 * Both labels come from the string catalogue.
 */
export interface SubmitButtonProps extends Omit<ButtonProps, 'type' | 'children'> {
  /** Label when the form is waiting for input. */
  readonly label: string;
  /** Label while the submission runs. */
  readonly pendingLabel: string;
  /** True while the submission runs. */
  readonly isSubmitting: boolean;
  /** Kept for symmetry with Button; the type is always submit. */
  readonly className?: string;
}

export function SubmitButton({
  label,
  pendingLabel,
  isSubmitting,
  disabled = false,
  className,
  ...props
}: SubmitButtonProps): React.ReactElement {
  return (
    <Button
      type="submit"
      disabled={disabled || isSubmitting}
      aria-busy={isSubmitting}
      className={cn(className)}
      {...props}
    >
      {isSubmitting ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
      <span aria-live="polite">{isSubmitting ? pendingLabel : label}</span>
    </Button>
  );
}
