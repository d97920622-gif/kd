// path: components/ui/textarea.tsx
import { cn } from '@/lib/utils/cn';

/**
 * Multiline text input.
 *
 * Same rules as the single line input: 44px minimum height from the touch
 * token scale, 16px text so iOS never zooms the viewport on focus, token
 * border and radius, and a focus indicator that is never removed. The
 * starting height is 64px (the 16 spacing step), which shows about three
 * lines of the 24px body line height without scrolling.
 *
 * Resizing is vertical only: a horizontal resize would break the layout of
 * the form grid it sits in.
 */
export type TextareaProps = React.ComponentProps<'textarea'>;

export function Textarea({ className, rows = 3, ...props }: TextareaProps): React.ReactElement {
  return (
    <textarea
      rows={rows}
      className={cn(
        'flex min-h-16 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors duration-fast ease-standard placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
