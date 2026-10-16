// path: components/motion/motion-provider.tsx
'use client';

import { MotionConfig, useReducedMotion } from 'framer-motion';
import { createContext, useContext, useMemo } from 'react';

import { motionTransition } from '@/lib/motion/tokens';

/**
 * MotionProvider: the one place the product decides how much it is allowed to
 * move.
 *
 * Three decisions, all of them about a reader who did not ask for animation:
 *
 *   1. **The preference is the reader's, read from the operating system.**
 *      `useReducedMotion()` reports `prefers-reduced-motion: reduce`, and
 *      `MotionConfig reducedMotion="user"` makes Framer Motion itself drop
 *      transform and layout animations for that reader while still running
 *      opacity. Both are set, because they cover different code: the config
 *      covers a `motion` element written by hand, and the flag below covers the
 *      components in this directory, which shorten their own durations to zero.
 *   2. **The default transition is a token, not a number.** A component that
 *      animates without naming a duration gets the system's `base` duration and
 *      `standard` curve, so "I forgot the transition" produces the product's
 *      motion rather than Framer Motion's defaults - which are a 0.3 second
 *      spring that matches nothing in the design system.
 *   3. **The decision is available to every component below.** `useMotionPreference()`
 *      returns the flag and a `transition()` helper that has already applied it,
 *      so the shortened duration is the path of least resistance rather than a
 *      rule a component has to remember. A component that needs the raw flag -
 *      to skip a stagger delay, to render a static illustration instead of an
 *      animated one - reads `reduced`.
 *
 * The provider is deliberately thin. It holds no state, subscribes to nothing
 * except the media query Framer Motion already watches, and renders one wrapper
 * element: a motion provider that changes the tree shape per navigation is a
 * provider that remounts the page it is meant to decorate.
 *
 * `force` exists for exactly one reason, and it is not a user setting: the
 * component gallery mounts a second provider with `force="reduce"` around a
 * specimen so the reduced path is *visible and inspectable* - the confetti
 * absent, the stagger flat, the illustration swapped for its still - on a
 * machine whose operating system says nothing about motion. A reader's own
 * preference is still the media query; a page can pin the opposite of a
 * preference for a specimen, and nothing in the product does.
 */
export interface MotionPreference {
  /** True when the reader asked their system for less motion. */
  readonly reduced: boolean;
  /**
   * A transition for one intent, with the reduced preference already applied:
   * at `reduced`, every duration in the system is zero.
   */
  readonly transition: (
    duration: 'instant' | 'fast' | 'base' | 'slow' | 'slower',
    ease?: 'standard' | 'enter' | 'exit' | 'linear',
  ) => { readonly duration: number; readonly ease: [number, number, number, number] | 'linear' };
}

const MotionPreferenceContext = createContext<MotionPreference>({
  reduced: false,
  transition: (duration, ease) => motionTransition(duration, ease ?? 'standard', false),
});

/** The product's motion preference, and the transition helper that applies it. */
export function useMotionPreference(): MotionPreference {
  return useContext(MotionPreferenceContext);
}

export interface MotionProviderProps {
  readonly children: React.ReactNode;
  /** Pin the decision. Omitted everywhere except a gallery specimen. */
  readonly force?: 'reduce' | 'no-preference';
}

export function MotionProvider({ children, force }: MotionProviderProps): React.ReactElement {
  const systemReduced = useReducedMotion() ?? false;
  const reduced = force === undefined ? systemReduced : force === 'reduce';

  const value = useMemo<MotionPreference>(
    () => ({
      reduced,
      transition: (duration, ease) => motionTransition(duration, ease ?? 'standard', reduced),
    }),
    [reduced],
  );

  return (
    <MotionPreferenceContext.Provider value={value}>
      <MotionConfig
        reducedMotion={force === undefined ? 'user' : reduced ? 'always' : 'never'}
        transition={motionTransition('base', 'standard', reduced)}
      >
        {children}
      </MotionConfig>
    </MotionPreferenceContext.Provider>
  );
}
