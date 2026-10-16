// path: components/motion/confetti.tsx
'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useMotionPreference } from '@/components/motion/motion-provider';

/**
 * Confetti: the celebration for a milestone, and the four things it must not do.
 *
 * FEATURE_LIST asks for confetti at two moments - the completion of onboarding
 * (517) and a payment success page (1734) - and the temptation is to treat it as
 * decoration. It is not: it is motion that covers the whole screen, so it has
 * obligations.
 *
 *   1. **It is decoration and says so.** The wrapper is `aria-hidden`, and the
 *      sentence that the milestone happened is rendered by the page, not by this
 *      component. A screen reader user gets the same news without the paper.
 *   2. **It never blocks a click.** `pointer-events-none`, `fixed inset-0` above
 *      the content, `z-toast`: confetti that intercepts a pointer turns a
 *      celebration into an unusable page for the two seconds it lasts.
 *   3. **It respects reduced motion by not existing.** When the provider reports
 *      the preference - which it reads once, from the operating system - this
 *      component renders nothing at all rather than a static picture of
 *      confetti: a frozen celebration is still a full-screen overlay. The
 *      milestone's copy is what carries the moment, and the page renders it
 *      whether or not the paper falls.
 *   4. **It cleans up after itself.** The pieces are removed when the fall
 *      finishes, so nothing stays mounted, no timer keeps running and the page
 *      does not hold a full-screen layer for the rest of the session.
 *
 * The pieces are `<span>` elements drawn from the palette: four semantic surface
 * colours, two shapes, no image, no canvas, and no new dependency. A canvas
 * confetti library would add a renderer and a second animation loop for an effect
 * two dozen elements can produce - and those elements stop existing when they are
 * done. They are laid out by a twelve-column grid rather than by calculated
 * positions, so the fall spreads across the screen without a raw length being
 * written into the markup.
 */
export interface ConfettiProps {
  /** How many pieces fall. Capped, because the cost is per element. */
  readonly pieces?: number;
  /** Seconds the fall lasts. Capped for the same reason. */
  readonly seconds?: number;
  /** Fires when the fall is over and the layer has removed itself. */
  readonly onDone?: () => void;
  readonly className?: string;
}

const MAX_SECONDS = 6;
const SURFACE_CLASSES = ['bg-primary', 'bg-success', 'bg-warning', 'bg-accent'] as const;
/**
 * The spread is a grid, not a calculated position: twelve columns, one piece per
 * cell, two rows of pieces. Different cells align their piece to the start, the
 * centre or the end, so the fall is uneven without a single raw length being
 * written anywhere - the alternative, positioning each piece with a percentage,
 * is a value the class system cannot know and an inline style the design-token
 * check exists to discourage.
 */
const COLUMNS = 12;
const ROWS = 2;
const MAX_PIECES = COLUMNS * ROWS;
const ALIGNMENTS = ['justify-self-start', 'justify-self-center', 'justify-self-end'] as const;

interface Piece {
  readonly id: number;
  readonly column: number;
  readonly row: number;
  readonly alignment: (typeof ALIGNMENTS)[number];
  readonly delaySeconds: number;
  readonly durationSeconds: number;
  readonly rotateDegrees: number;
  readonly round: boolean;
  readonly surface: (typeof SURFACE_CLASSES)[number];
  readonly sizeClass: string;
}

/** The pieces, computed once per mount so a re-render cannot re-randomise them. */
function buildPieces(count: number, seconds: number, seed: number): readonly Piece[] {
  return Array.from({ length: Math.min(count, MAX_PIECES) }, (_, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS) % ROWS;
    return {
      id: index,
      column,
      row,
      alignment: ALIGNMENTS[(column + row) % ALIGNMENTS.length],
      delaySeconds: pseudoRandom(seed + index * 3) * (seconds * 0.35),
      durationSeconds: seconds * (0.65 + pseudoRandom(seed + index * 5) * 0.35),
      rotateDegrees: 180 + Math.round(pseudoRandom(seed + index * 11) * 900),
      round: index % 3 === 0,
      surface: SURFACE_CLASSES[index % SURFACE_CLASSES.length],
      sizeClass: index % 4 === 0 ? 'size-2' : 'size-1.5',
    };
  });
}

/**
 * A small deterministic generator. Math.random() would produce different pieces
 * on the server and in the browser if this ever rendered on both; a fixed seed
 * keeps the layout stable and the effect identical for a given mount.
 */
function pseudoRandom(value: number): number {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function Confetti({
  pieces = 24,
  seconds = 3,
  onDone,
  className,
}: ConfettiProps): React.ReactElement | null {
  /*
   * The preference is read from the provider and nowhere else. A second
   * subscription to the media query is how two parts of one page end up
   * disagreeing about it, and the provider is already above every route.
   */
  const { reduced } = useMotionPreference();
  const [done, setDone] = useState(false);
  const count = Math.max(1, Math.min(pieces, MAX_PIECES));
  const spreadSeconds = Math.max(1, Math.min(seconds, MAX_SECONDS));
  const items = useMemo(
    () => buildPieces(count, spreadSeconds, count * 13 + 1),
    [count, spreadSeconds],
  );
  /*
   * The callback lives in a ref, and the effect does not depend on it. A parent
   * that passes an arrow function - which is every parent - would otherwise hand
   * this component a new callback on each render and restart the fall timer
   * every time it rendered, so a page that re-rendered twice would never finish
   * the celebration and never remove the layer.
   */
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (reduced) {
      setDone(true);
      onDoneRef.current?.();
      return;
    }
    const longest = Math.max(...items.map((piece) => piece.delaySeconds + piece.durationSeconds));
    const timer = window.setTimeout(
      () => {
        setDone(true);
        onDoneRef.current?.();
      },
      longest * 1000 + 120,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [items, reduced]);

  if (reduced || done) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      data-motion="confetti"
      className={`pointer-events-none fixed inset-0 z-toast grid grid-cols-12 grid-rows-2 overflow-hidden ${className ?? ''}`}
    >
      {items.map((piece) => (
        // The cell carries the position and the inner element carries the
        // motion. Splitting them keeps the animated style object to motion
        // properties only, so the piece has one thing to say about itself.
        <span key={piece.id} className={`flex justify-center ${piece.alignment}`}>
          <motion.span
            data-confetti-piece={piece.id}
            initial={{ y: '-12vh', opacity: 1, rotate: 0 }}
            animate={{ y: '112vh', opacity: 0, rotate: piece.rotateDegrees }}
            transition={{
              duration: piece.durationSeconds,
              delay: piece.delaySeconds,
              ease: 'linear',
            }}
            className={`block ${piece.sizeClass} ${piece.surface} ${piece.round ? 'rounded-full' : 'rounded-sm'}`}
          />
        </span>
      ))}
    </div>
  );
}
