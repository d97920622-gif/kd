// path: components/motion/reveal.tsx
'use client';

import { motion } from 'framer-motion';

import { useMotionPreference } from '@/components/motion/motion-provider';
import { cn } from '@/lib/utils/cn';

/**
 * Reveal: the arrival of a panel that appeared because something went right.
 *
 * This is the product's happy-path animation (FEATURE_LIST A3.36): the moment a
 * form is accepted, a payment clears or a step is completed, the result does not
 * simply appear - it fades up and settles, so the reader's eye is told where the
 * new information is. The same component covers A3.31, the scale and fade pair,
 * because an entrance that only faded would look like a slow paint and an
 * entrance that only scaled would move content the reader is already reading.
 *
 * The rules, all of them about not making a good moment a bad one:
 *
 *   1. **It animates once, on mount.** There is no exit, no repeat and no
 *      `whileInView`: content that animates every time it scrolls past is
 *      content the reader learns to scroll past quickly. If a page needs the
 *      arrival again - a form submitted twice - it changes the `key`, which is
 *      the same thing that gives the second result its own identity.
 *   2. **Scale moves inwards, never outwards.** 0.98 to 1 reads as settling;
 *      an entrance that starts larger than its final size makes the layout look
 *      as if it is being pushed. The offset, like the page transition's, is a
 *      few pixels and not a travel.
 *   3. **Reduced motion paints it immediately.** At `reduce` both the scale and
 *      the offset are 1 and 0 and the duration is the token module's zero, so
 *      the panel is simply there. The information is never behind the
 *      animation: nothing here is hidden until an event fires, it is only
 *      placed slightly, and a reader who asked for less motion loses the
 *      placement and keeps everything else.
 *   4. **A delay is opt-in and small.** `delaySeconds` exists so a group of
 *      panels can be ordered by the page rather than by a stagger that decides
 *      for it. It is capped, because a delay long enough to notice is a delay
 *      long enough to look like a bug.
 */

/** How far the panel rises, in pixels. Small on purpose: a hint, not a travel. */
const RISE_PX = 6;
/** How much smaller it starts. A settle, not a zoom. */
const ENTER_SCALE = 0.98;
/** The longest delay a caller may ask for, in seconds. */
const MAX_DELAY_SECONDS = 0.4;

export interface RevealProps {
  readonly children: React.ReactNode;
  /** Seconds to wait before arriving, capped at 0.4. */
  readonly delaySeconds?: number;
  readonly className?: string;
}

export function Reveal({ children, delaySeconds = 0, className }: RevealProps): React.ReactElement {
  const { reduced, transition } = useMotionPreference();
  const delay = reduced ? 0 : Math.min(Math.max(delaySeconds, 0), MAX_DELAY_SECONDS);

  return (
    <motion.div
      data-motion="reveal"
      data-motion-reduced={reduced ? 'true' : 'false'}
      initial={{ opacity: 0, y: reduced ? 0 : RISE_PX, scale: reduced ? 1 : ENTER_SCALE }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...transition('base', 'enter'), delay }}
      className={cn('motion-reduce:transform-none', className)}
    >
      {children}
    </motion.div>
  );
}
