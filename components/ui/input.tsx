// path: components/ui/input.tsx
import { cn } from '@/lib/utils/cn';

/**
 * Text input.
 *
 * The control is 44px tall, which meets the touch target minimum, and its
 * text is 16px. Sixteen pixels is not a style choice: an input below 16px
 * makes iOS Safari zoom the viewport on focus, which strands the user in a
 * magnified page. The typography token check fails the build if the body step
 * drops below that.
 *
 * Labels, helper text and error text are the caller's responsibility and must
 * come from the string catalogue; this file holds no display text.
 */
export type InputProps = React.ComponentProps<'input'>;

export function Input({ className, type = 'text', ...props }: InputProps): React.ReactElement {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base shadow-sm transition-colors duration-fast ease-standard placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
        className,
      )}
      {...props}
    />
  );
}
