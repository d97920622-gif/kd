// path: components/ui/popover.tsx
'use client';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils/cn';

/**
 * Popover: a small surface anchored to the control that opens it.
 *
 * Radix keeps the focus contract of a dialog without making the page inert:
 * focus can leave the popover, the trigger reports aria-expanded, Escape
 * closes it and returns focus to the trigger, and the content is labelled by
 * the trigger rather than by a title, which is the pattern for a date picker
 * or a filter panel.
 *
 * Unlike a tooltip, a popover is interactive: it may contain a form, buttons
 * or a calendar, so it never opens on hover and never closes on pointer exit.
 *
 * Layering uses z-popover, the topmost panel layer below a tooltip: a popover
 * can be opened from inside a dialog and must still paint above it.
 */
export const Popover = PopoverPrimitive.Root;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverClose = PopoverPrimitive.Close;

export type PopoverContentProps = React.ComponentProps<typeof PopoverPrimitive.Content>;

export function PopoverContent({
  className,
  align = 'center',
  sideOffset = 4,
  ...props
}: PopoverContentProps): React.ReactElement {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-popover w-popover rounded-md border bg-popover p-4 text-popover-foreground shadow-md',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
