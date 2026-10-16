// path: components/motion/press-feedback.tsx
'use client';

import { motion } from 'framer-motion';

import { useMotionPreference } from '@/components/motion/motion-provider';
import { cn } from '@/lib/utils/cn';

/**
 * PressFeedback: the answer a control gives while a pointer is holding it down.
 *
 * The `Button` primitive carries the same feedback as classes, and that is the
 * right default - it costs nothing and needs no client component. This wrapper
 * exists for the controls that are not a `Button`: a card that opens a record, a
 * tile that selects a plan, a row that expands, a drop target. Those are all
 * `<button>` or `<a>` elements with their own markup, and the feedback a reader
 * expects from them is identical, so it is expressed once here rather than
 * copied as a Framer `whileTap` prop into each page.
 *
 * What it deliberately does not do:
 *
 *   - **It does not add a role, a tab index or a handler.** The element inside
 *     keeps its own semantics and its own keyboard behaviour; this wrapper only
 *     moves what is already focusable. A wrapper that made a `<div>` clickable
 *     would be a worse control than the one it decorated.
 *   - **It does not animate opacity.** The press scale is the whole effect. A
 *     fading control is a control that looks disabled exactly when the reader is
 *     waiting for the answer.
 *   - **It does not move the layout.** Scale is a transform, so the press is
 *     painted by the compositor and the surrounding content does not reflow by
 *     a single pixel.
 *   - **It listens to the motion preference twice.** Framer Motion's
 *     `reducedMotion="user"` config already skips transform animations for a
 *     reader who asked for less motion; the explicit `1` below means the markup
 *     and the computed style agree as well, which is what a test or a reviewer
 *     reads.
 *
 * The hover lift is small and is a lift, not a jump: 1.01 at most, which is one
 * pixel on a 100 pixel tile.
 */
export interface PressFeedbackProps {
  readonly children: React.ReactNode;
  /** How far the control lifts on hover. Capped at the value below. */
  readonly hoverScale?: number;
  readonly className?: string;
}

/** The lift on hover. Kept under two percent. */
const HOVER_SCALE = 1.01;
/** How far the control shrinks while held down. */
const PRESS_SCALE = 0.97;

export function PressFeedback({
  children,
  hoverScale = HOVER_SCALE,
  className,
}: PressFeedbackProps): React.ReactElement {
  const { reduced, transition } = useMotionPreference();
  const lift = reduced ? 1 : Math.min(Math.max(hoverScale, 1), HOVER_SCALE);

  return (
    <motion.span
      data-motion="press-feedback"
      data-motion-reduced={reduced ? 'true' : 'false'}
      whileHover={{ scale: lift }}
      whileTap={{ scale: reduced ? 1 : PRESS_SCALE }}
      transition={transition('fast', 'standard')}
      className={cn('inline-flex', className)}
    >
      {children}
    </motion.span>
  );
}
