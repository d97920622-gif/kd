// path: components/motion/page-transition.tsx
'use client';

import { motion } from 'framer-motion';

import { useMotionPreference } from '@/components/motion/motion-provider';

/**
 * PageTransition: the fade and the short rise that carry a reader from one page
 * to the next.
 *
 * Routed through `app/template.tsx`, which the App Router remounts on every
 * navigation. A template is the correct place for this and a layout is not: a
 * layout persists across navigations precisely so it does not animate, and
 * wrapping one in a transition would re-animate the chrome on every click.
 *
 * Three rules, each of them a way this component would otherwise be an
 * accessibility problem:
 *
 *   1. **Nothing moves more than 8 pixels.** A page that slides in from the side
 *      is a page that makes a reader with a vestibular disorder reach for the
 *      close button. The rise is a token-sized hint that the content changed,
 *      not a scene change, and it fades rather than travels.
 *   2. **Reduced motion removes it entirely.** At `reduce`, the duration from
 *      the token module is zero and the offset is zero, so the content is
 *      painted where it belongs with no animation frame at all - not a faster
 *      animation, no animation. `MotionConfig` already drops transform
 *      animations for these readers; this component additionally takes the
 *      offset out, so the markup and the computed style agree.
 *   3. **Focus is never moved by it.** The wrapper is a plain element with no
 *      `tabIndex` and no `aria-live`: a transition that announced itself would
 *      interrupt a screen reader on every navigation, and the page's own heading
 *      is what tells the reader where they arrived.
 *
 * The transition is deliberately not an `AnimatePresence` exit animation. An
 * exit animation delays the next page until the old one has finished leaving,
 * which a slow device turns into a visible stall on every click; the App Router
 * has already swapped the content by the time this mounts.
 */
const RISE_PX = 8;

export function PageTransition({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  const { reduced, transition } = useMotionPreference();

  return (
    <motion.div
      data-motion="page-transition"
      data-motion-reduced={reduced ? 'true' : 'false'}
      initial={{ opacity: 0, y: reduced ? 0 : RISE_PX }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition('slow', 'enter')}
    >
      {children}
    </motion.div>
  );
}
