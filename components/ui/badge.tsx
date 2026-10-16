// path: components/ui/badge.tsx
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

/**
 * Badge: a short status label attached to a row, a card or a heading.
 *
 * A badge is read, not clicked, so it is a span and never a button. It is
 * also never the only signal of a state: every status it shows is carried by
 * the text itself as well as by the color, because color alone fails for a
 * color blind user, in forced colors mode and in a black and white print.
 * An invoice that is overdue reads "Overdue" in the badge; the red is
 * reinforcement.
 *
 * Every variant uses a semantic role pair from the token module, and every
 * one of those pairs is verified by check:color-contrast at 4.5:1 in all four
 * themes, including the high contrast themes where the pairs must reach 7:1.
 * There is no variant that relies on a raw color.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
