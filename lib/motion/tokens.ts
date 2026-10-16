// path: lib/motion/tokens.ts
/**
 * Motion tokens for JavaScript, read from the same declarations as the CSS.
 *
 * The design system already declares durations and easings once, in
 * `config/design-tokens.ts`, and `styles/globals.css` turns them into custom
 * properties that CSS transitions consume. Framer Motion cannot read a custom
 * property for a spring or a tween: it needs a number of seconds and an array of
 * cubic-bezier control points. Writing those numbers a second time in the
 * components is how a product ends up with two motion systems - one the tokens
 * describe, one the animations actually use - and the drift is invisible, because
 * both look plausible.
 *
 * So this module is the bridge and the only place the conversion happens:
 *
 *   - `motionDuration('slow')` is `0.32` seconds, parsed from `320ms`.
 *   - `motionEase('enter')` is `[0, 0, 0.2, 1]`, parsed from the cubic-bezier
 *     the token declares.
 *   - `motionTransition('slow', 'enter')` is the object a `transition` prop
 *     wants, so a component never assembles one itself.
 *
 * The tokens are also the reduced-motion contract. Each duration carries the
 * value to use when the reader has asked for less motion, and inside
 * `prefers-reduced-motion: reduce` every one of them is `0ms`. Framer Motion is
 * told about the preference twice on purpose - `MotionConfig reducedMotion="user"`
 * in the provider, and the explicit duration this module hands back - so a
 * component that animates through a raw `transition` still collapses to nothing
 * instead of relying on one mechanism being wired correctly.
 *
 * The import carries the .ts extension for the reason config/brand.ts explains:
 * without it the specifier can resolve to the generated config/design-tokens.json
 * beside the module, and the values Framer Motion animates would silently stop
 * being the ones the stylesheet uses.
 *
 * Everything here is data and arithmetic: no browser, no React, so it is safe to
 * import from a server component, a client component or a script.
 */
import { MOTION_DURATION_TOKENS, MOTION_EASING_TOKENS } from '@/config/design-tokens.ts';

/** The duration keys the design system declares. */
export type MotionDurationKey = keyof typeof MOTION_DURATION_TOKENS;
/** The easing keys the design system declares. */
export type MotionEasingKey = keyof typeof MOTION_EASING_TOKENS;

/** Milliseconds in a second, named so the conversion reads as arithmetic. */
const MS_PER_SECOND = 1000;

/**
 * A duration in seconds, for Framer Motion.
 *
 * `reduce` collapses the value to zero: a token whose `reducedValue` is `0ms` is
 * a token that must not animate when the reader has asked for less motion, and
 * every token in the system is declared that way. A caller that wants the
 * unreduced value for a non-animation use reads `MOTION_DURATION_TOKENS`
 * directly.
 */
export function motionDuration(key: MotionDurationKey, reduce = false): number {
  const token = MOTION_DURATION_TOKENS[key];
  const value = reduce ? token.reducedValue : token.value;
  return parseMilliseconds(value) / MS_PER_SECOND;
}

/** `320ms` to `320`. A value that is not in milliseconds throws rather than guessing. */
export function parseMilliseconds(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)ms$/.exec(value.trim());
  if (match === null) {
    throw new RangeError(`A motion duration must be written in milliseconds, received "${value}".`);
  }
  return Number(match[1]);
}

/**
 * An easing as the control-point array Framer Motion accepts: `[x1, y1, x2, y2]`.
 *
 * `linear` is the one easing that is not a cubic-bezier, and Framer Motion takes
 * the string for it, so the string is what this returns. The union type is the
 * honest signature: a caller passing it to a `transition` gets a value Framer
 * Motion understands, not a value that needs converting again.
 */
export function motionEase(key: MotionEasingKey): [number, number, number, number] | 'linear' {
  const value = MOTION_EASING_TOKENS[key].value;
  if (value === 'linear') {
    return 'linear';
  }
  const numbers = [...value.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (numbers.length !== 4) {
    throw new RangeError(`A cubic-bezier easing needs four control points, received "${value}".`);
  }
  return [numbers[0], numbers[1], numbers[2], numbers[3]];
}

/** What a `transition` prop wants: a duration in seconds and an easing. */
export interface MotionTransition {
  readonly duration: number;
  readonly ease: [number, number, number, number] | 'linear';
}

/** The transition for one intent: how long, and with which curve. */
export function motionTransition(
  duration: MotionDurationKey,
  ease: MotionEasingKey = 'standard',
  reduce = false,
): MotionTransition {
  return { duration: motionDuration(duration, reduce), ease: motionEase(ease) };
}

/** A restatement of the declarations, for the check and for documentation. */
export const MOTION_TOKEN_SUMMARY = {
  durations: Object.keys(MOTION_DURATION_TOKENS),
  easings: Object.keys(MOTION_EASING_TOKENS),
} as const;
