// path: components/ui/tooltip.tsx
'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils/cn';

/**
 * Tooltip: a short hint attached to a control.
 *
 * The tooltip is never the only place a piece of information exists. It
 * appears on hover and on keyboard focus, so a mouse user and a keyboard user
 * get the same hint, and it disappears when the control loses focus. A
 * requirement, an error or a status is rendered as visible text next to the
 * control instead: a tooltip is invisible to a touch user and cannot be
 * reached at all.
 *
 * Every icon-only button still carries an aria-label, so the tooltip is
 * reinforcement for a sighted user and never the accessible name. That is
 * also why TooltipProvider sets delayDuration to 200ms rather than the
 * library default: a hint that appears after a second of hovering feels
 * broken, and a keyboard user reaches it immediately regardless.
 *
 * Layering uses z-tooltip, above every panel, because a tooltip can be opened
 * from a control inside a dialog, a popover or an open select.
 */
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipPortal = TooltipPrimitive.Portal;

export const TOOLTIP_DELAY_MS = 200;

export type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>;

export type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content>;

export function TooltipProvider({
  delayDuration = TOOLTIP_DELAY_MS,
  ...props
}: TooltipProviderProps): React.ReactElement {
  return <TooltipPrimitive.Provider delayDuration={delayDuration} {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: TooltipContentProps): React.ReactElement {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-tooltip max-w-tooltip rounded-md bg-foreground px-2 py-1 text-xs leading-4 text-background shadow-sm',
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
