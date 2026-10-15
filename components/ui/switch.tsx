// path: components/ui/switch.tsx
'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils/cn';

/**
 * Switch.
 *
 * Radix renders a real button with role="switch" and aria-checked, so the
 * state is announced as on or off rather than as a pressed button, and the
 * space key toggles it.
 *
 * The track is 44px wide and 24px tall, the shape a settings row expects, and
 * a pseudo-element that renders nothing extends the pointer target vertically
 * to the 44px minimum. The thumb travels 20px, which is 44 minus the 20px
 * thumb and the 2px inset on both sides, so it lands flush inside the track at
 * both ends without a raw pixel value.
 *
 * A switch is for a setting that takes effect immediately. A choice that is
 * submitted with a form uses the checkbox instead.
 */
export type SwitchProps = React.ComponentProps<typeof SwitchPrimitive.Root>;

export function Switch({ className, ...props }: SwitchProps): React.ReactElement {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-fast ease-standard after:absolute after:-inset-y-2.5 after:content-[''] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-background shadow-sm transition-transform duration-fast ease-standard data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0.5',
        )}
      />
    </SwitchPrimitive.Root>
  );
}
