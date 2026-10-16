// path: components/ui/button.tsx
'use client';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

/**
 * Button.
 *
 * Every class comes from the design tokens: spacing steps, radius, shadow,
 * motion durations and semantic color roles. There is no raw color, no raw
 * size and no arbitrary value, so the button is complete in light, dark and
 * both high contrast themes without a single conditional style.
 *
 * Three motion decisions live on the base class (sub-step 1.25):
 *
 *   - **Hover and press are both stated.** A pointer that rests on a button
 *     gets the hover background from its variant, and a press shrinks it by the
 *     Tailwind scale step. A press is the one piece of feedback a keyboard user
 *     never sees, which is why the press is never the *only* feedback: focus
 *     and disabled states are visible on their own.
 *   - **Both are `motion-safe`.** `active:scale-95` is a transform, so a reader
 *     who asked for less motion is given the press without the movement rather
 *     than a snap the stylesheet only shortens. The `motion-safe` variant is
 *     the class-level form of the same promise the duration tokens make.
 *   - **Focus pulses once.** `focus-visible:animate-focus-pulse` runs the
 *     one-shot pulse from tailwind.config.ts: the global `:focus-visible`
 *     outline slides from a wider offset into place, never thinning and never
 *     disappearing. The indicator is the outline; the pulse is only its
 *     approach.
 *
 * Touch targets: default (44px tall) and lg (48px tall) meet the 44x44
 * minimum, and icon is 44x44. The sm step (36px) exists for dense desktop
 * toolbars driven by a pointer; a dense surface that must stay touch safe
 * keeps the row at min-h-touch instead of shrinking the control.
 *
 * The focus ring comes from the global :focus-visible rule in
 * styles/globals.css. No variant sets outline-none, because removing the
 * indicator is never allowed.
 *
 * Icon-only usage must pass an accessible name:
 *   <Button size="icon" aria-label={t('common.action_settings')}>
 *     <Settings aria-hidden="true" />
 *   </Button>
 */
export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition duration-fast ease-standard motion-safe:active:scale-95 motion-safe:focus-visible:animate-focus-pulse disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-1 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-11 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Render the single child element instead of a button, keeping the styles. */
  readonly asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={asChild ? undefined : type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
