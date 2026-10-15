// path: components/ui/radio-group.tsx
'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils/cn';

/**
 * Radio group and radio item.
 *
 * Radix gives the group role="radiogroup" and arrow key navigation with a
 * roving tabindex, which is the behaviour a user expects from a radio set and
 * the behaviour a set of buttons with click handlers does not provide.
 *
 * The item follows the same pattern as the checkbox: a 16px visible circle
 * with a 10px dot when selected, and a pseudo-element that expands the
 * pointer target to 44x44 without rendering anything visible.
 *
 * Group and item labels are always passed by the caller from the catalogue.
 */
export type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root>;

export type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item>;

export function RadioGroup({ className, ...props }: RadioGroupProps): React.ReactElement {
  return <RadioGroupPrimitive.Root className={cn('grid gap-3', className)} {...props} />;
}

export function RadioGroupItem({ className, ...props }: RadioGroupItemProps): React.ReactElement {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background shadow-sm transition-colors duration-fast ease-standard after:absolute after:-inset-3.5 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <span aria-hidden="true" className="block size-2.5 rounded-full bg-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
