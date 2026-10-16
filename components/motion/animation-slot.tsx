// path: components/motion/animation-slot.tsx
'use client';

import { useMotionPreference } from '@/components/motion/motion-provider';
import { cn } from '@/lib/utils/cn';

/**
 * AnimationSlot: the frame an animation is allowed to play inside, and the rules
 * it inherits by using it.
 *
 * The plan asks for a drawing baseline and for animation support (Lottie is
 * named in FEATURE_LIST A3.34). This component is how that support is delivered
 * without a renderer dependency: it owns the *contract* an animation must meet,
 * and any renderer - a Lottie player, an SVG with a timeline, a video - is
 * dropped in as a child. Adding a renderer later changes one import in the page
 * that wants it, not the rules, and nothing in this build pretends to play a
 * format it cannot.
 *
 * The contract, in the order it matters:
 *
 *   1. **An animation is decoration.** The wrapper is `aria-hidden="true"` and
 *      the sentence that carries the meaning is rendered by the page beside it.
 *      An animation that is the only place a fact exists is a fact a screen
 *      reader never receives. A caller that genuinely needs an accessible name
 *      passes `labelKey`, and then the wrapper stops being hidden and carries
 *      `role="img"` with that name - which is the exception, not the default.
 *   2. **The box is reserved before the animation loads.** A fixed aspect ratio
 *      and a width from the layout tokens mean the animation cannot shift the
 *      page when it arrives, which is the same promise `Skeleton` makes. The
 *      ratio is chosen from three named options rather than passed as a number,
 *      so a page cannot invent a fourth one.
 *   3. **Reduced motion shows the still, immediately and completely.** The
 *      `still` child is what renders when the reader has asked for less motion:
 *      a static drawing of the same thing, never a paused animation and never an
 *      empty box. This is why `still` is a required prop - an animation without a
 *      still has no reduced-motion answer, and the compiler refuses it rather
 *      than the reader discovering it.
 *   4. **The slot never animates on its own.** It is a frame: it has no
 *      entrance, no pulse and no hover state. Motion belongs to the thing inside
 *      it, and a frame that moves makes every animation inside it harder to read.
 */
export type AnimationRatio = 'wide' | 'square' | 'tall';

export interface AnimationSlotProps {
  /** The animation. Any renderer; the slot only frames it. */
  readonly children: React.ReactNode;
  /** What a reader who asked for less motion sees instead. Required. */
  readonly still: React.ReactNode;
  readonly ratio?: AnimationRatio;
  /** Accessible name, only for an animation that is not purely decorative. */
  readonly label?: string;
  /** Width from the layout tokens: `sheet` by default, `page` for a wide band. */
  readonly width?: 'sheet' | 'page' | 'tooltip';
  readonly className?: string;
}

const RATIO_CLASS: Record<AnimationRatio, string> = {
  wide: 'aspect-[16/9]',
  square: 'aspect-square',
  tall: 'aspect-[3/4]',
};

const WIDTH_CLASS: Record<NonNullable<AnimationSlotProps['width']>, string> = {
  sheet: 'w-sheet',
  page: 'w-page',
  tooltip: 'w-tooltip',
};

export function AnimationSlot({
  children,
  still,
  ratio = 'wide',
  label,
  width = 'sheet',
  className,
}: AnimationSlotProps): React.ReactElement {
  const { reduced } = useMotionPreference();
  const described = label !== undefined;
  return (
    <div
      {...(described
        ? { role: 'img', 'aria-label': label }
        : { 'aria-hidden': true, 'aria-label': undefined })}
      data-motion="animation-slot"
      data-motion-ratio={ratio}
      data-motion-reduced={reduced ? 'true' : 'false'}
      className={cn(
        'grid flex-none place-items-center overflow-hidden rounded-lg border border-border bg-muted text-muted-foreground',
        RATIO_CLASS[ratio],
        WIDTH_CLASS[width],
        className,
      )}
    >
      {reduced ? still : children}
    </div>
  );
}
