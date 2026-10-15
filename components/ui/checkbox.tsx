// path: components/ui/checkbox.tsx
'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Checkbox.
 *
 * The visible box is 16px, which is what a dense settings form and a data
 * table need. The pointer target is expanded to 44x44 by a pseudo-element
 * that renders nothing at all: content is the empty string, so no text or
 * icon is generated and the box looks unchanged, while a thumb on a phone
 * still hits it. The expansion is symmetric, so the target does not drift
 * toward one side and destabilise neighbouring controls.
 *
 * Accessibility comes from Radix: the control is a real button with
 * role="checkbox", aria-checked, keyboard support for the space key, and an
 * indeterminate state when checked is the string "indeterminate".
 *
 * The label text is always passed by the caller from the string catalogue.
 */
export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

export function Checkbox({ className, ...props }: CheckboxProps): React.ReactElement {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background shadow-sm transition-colors duration-fast ease-standard after:absolute after:-inset-3.5 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=indeterminate]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:text-primary-foreground",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
