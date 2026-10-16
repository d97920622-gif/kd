// path: components/ui/skeleton.tsx
import { cn } from '@/lib/utils/cn';

/**
 * Skeleton: the shape of content that has not arrived yet.
 *
 * A skeleton is a layout promise. It must match the size and position of what
 * replaces it, or the page jumps when the data lands and the user loses the
 * element they were about to click. That is why every skeleton is sized by
 * the caller with the same token classes the real content uses.
 *
 * The pulse animation is the only motion here, and it stops by itself when
 * the operating system asks for reduced motion: styles/globals.css collapses
 * animation duration and repetition inside the reduced motion block, so no
 * variant of this component has to know about the preference.
 *
 * A skeleton is hidden from assistive technology. It carries no information:
 * the live region that announces "loading" is the caller's job, because only
 * the caller knows what is being loaded and which of the four page states is
 * on screen.
 */
export interface SkeletonProps extends React.ComponentProps<'div'> {
  /** Circular skeleton for an avatar or an icon placeholder. */
  readonly shape?: 'line' | 'block' | 'circle';
}

export function Skeleton({
  className,
  shape = 'block',
  ...props
}: SkeletonProps): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-muted',
        shape === 'line' && 'h-4 rounded-sm',
        shape === 'block' && 'rounded-md',
        shape === 'circle' && 'rounded-full',
        className,
      )}
      {...props}
    />
  );
}

/**
 * A short paragraph of loading lines. The last line is narrower so the block
 * looks like text rather than like a solid rectangle, which is what makes a
 * skeleton read as content instead of as a broken image.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  readonly lines?: number;
  readonly className?: string;
}): React.ReactElement {
  const rows = Array.from({ length: Math.max(1, lines) }, (_, index) => index);
  return (
    <div className={cn('grid gap-2', className)}>
      {rows.map((row) => (
        <Skeleton key={row} shape="line" className={row === rows.length - 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  );
}
