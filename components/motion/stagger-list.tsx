// path: components/motion/stagger-list.tsx
'use client';

import { motion } from 'framer-motion';

import { useMotionPreference } from '@/components/motion/motion-provider';
import { motionDuration } from '@/lib/motion/tokens';
import { cn } from '@/lib/utils/cn';

/**
 * StaggerList: a list whose rows arrive one after another.
 *
 * The effect is one thing - a short delay per row - and the reason it is a
 * component rather than a `transition` prop copied onto every `<li>` is that
 * three rules have to be applied together or the effect is worse than none:
 *
 *   1. **The delay is capped.** A list of forty rows at 60 milliseconds each
 *      takes two and a half seconds to finish arriving, and the reader who is
 *      scrolling has already passed it. The delay per row is capped at six rows'
 *      worth, after which the remaining rows animate together: the effect reads
 *      as a wave, not as a slideshow.
 *   2. **The total is bounded by the duration tokens.** Each row uses the
 *      system's `base` duration and `enter` curve, so the motion matches every
 *      other arrival in the product instead of inventing a curve.
 *   3. **Reduced motion flattens it completely.** At `reduce` the duration is
 *      zero and the delay is zero, so the whole list paints at once. A stagger
 *      is the most vestibular-hostile animation in the product - many elements
 *      moving at once - which is exactly why it takes the preference seriously
 *      rather than shortening to a fast stagger.
 *
 * The rows are rendered by the caller. This component does not know what is in
 * the list, does not own keys, and does not reorder anything: it wraps what a
 * page already renders, so the same markup works with motion on or off.
 */
export interface StaggerListProps {
  readonly children: readonly React.ReactNode[];
  /** The element a list becomes: `ul` by default, `div` for a grid of cards. */
  readonly as?: 'ul' | 'div';
  /**
   * Delay between rows, in seconds. Left out, the step is derived from the
   * system's fast duration; the cap below applies either way.
   */
  readonly stepSeconds?: number;
  readonly className?: string;
  readonly itemClassName?: string;
}

/** Rows past this index animate together, so a long list cannot crawl in. */
const MAX_STAGGERED_ROWS = 6;
/**
 * How much of the fast duration one row waits for the row above it.
 *
 * The step is a *fraction of a token* rather than a number: 40 milliseconds is
 * not one of the design system's durations, so writing it here would be the
 * first hardcoded motion value in the product and the beginning of a second
 * motion scale. Reading the token means a change to `--duration-fast` moves the
 * stagger with it.
 */
const STEP_RATIO = 0.35;

export function StaggerList({
  children,
  as = 'ul',
  stepSeconds,
  className,
  itemClassName,
}: StaggerListProps): React.ReactElement {
  const { reduced, transition } = useMotionPreference();
  const List = as === 'ul' ? motion.ul : motion.div;
  const Item = as === 'ul' ? motion.li : motion.div;
  const step = reduced ? 0 : (stepSeconds ?? motionDuration('fast') * STEP_RATIO);

  return (
    <List
      data-motion="stagger-list"
      data-motion-reduced={reduced ? 'true' : 'false'}
      className={cn('grid gap-2', className)}
    >
      {children.map((child, index) => (
        <Item
          // The child's own key is not available here; the index is the only
          // stable identity a caller's array has, and reordering a staggered
          // list is not a supported case - reorder with layout, not with delay.
          key={index}
          data-motion-item={index}
          initial={{ opacity: 0, y: reduced ? 0 : 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            ...transition('base', 'enter'),
            delay: Math.min(index, MAX_STAGGERED_ROWS) * step,
          }}
          className={itemClassName}
        >
          {child}
        </Item>
      ))}
    </List>
  );
}
