// path: components/ui/label.tsx
'use client';

import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils/cn';

/**
 * Form label.
 *
 * Radix handles the association: clicking the label focuses or toggles the
 * control it names, and a control rendered with id gets a real for attribute
 * rather than a click handler that assistive technology cannot see.
 *
 * The peer-disabled variants depend on the control carrying the peer class;
 * every control in this library does, so a disabled control also dims its
 * label and its helper text.
 *
 * The label text is always passed by the caller from the string catalogue.
 */
export type LabelProps = React.ComponentProps<typeof LabelPrimitive.Root>;

export function Label({ className, ...props }: LabelProps): React.ReactElement {
  return (
    <LabelPrimitive.Root
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  );
}
