// path: components/shared/state-illustration.tsx
/**
 * The drawing a state shows when it has nothing else to show.
 *
 * Every state in the product - empty, error, permission, offline - is a
 * sentence and a control with a lot of space around them, and a bare panel in
 * the middle of a page reads as a page that failed to load rather than as a
 * page with something to say. The illustration is what makes the difference,
 * and it is drawn rather than imported for three reasons:
 *
 *   1. **It follows the palette.** The strokes are `currentColor` and the fills
 *      are token classes, so the same drawing is correct in light, dark and
 *      both high-contrast themes without a second asset. A shipped SVG file
 *      with a hard-coded stroke would be wrong in at least one theme, and the
 *      wrongness would be invisible until someone opened that theme.
 *   2. **It cannot go stale.** There is no file to re-export when the palette
 *      changes, and nothing binary in the repository to review.
 *   3. **It is decoration and says so.** The wrapper is `aria-hidden` and the
 *      drawing carries no text, because the heading beside it is the
 *      information. A screen reader that announced the drawing would be reading
 *      a picture of an empty page to someone who cannot see the empty page.
 *
 * The four drawings are deliberately geometric: a frame with nothing in it, a
 * frame with a break in it, a locked frame, and a frame with the signal cut.
 * They are distinguishable at 320 pixels wide, which is the size that decides
 * whether an illustration helps or gets in the way.
 */
export type StateIllustrationKind = 'empty' | 'error' | 'permission' | 'offline';

export interface StateIllustrationProps {
  readonly kind: StateIllustrationKind;
  readonly className?: string;
}

const VIEW_BOX = '0 0 96 72';
const FRAME_PATH = 'M14 12h68a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z';

function Paths({ kind }: { readonly kind: StateIllustrationKind }): React.ReactElement {
  switch (kind) {
    case 'empty':
      return (
        <>
          <path d={FRAME_PATH} strokeDasharray="6 5" />
          <path d="M38 34h20" />
        </>
      );
    case 'error':
      return (
        <>
          <path d={FRAME_PATH} strokeDasharray="6 5" />
          <path d="M34 26l12 12M46 26L34 38" />
        </>
      );
    case 'permission':
      return (
        <>
          <path d="M56 34h14v18H26V34h14" />
          <path d="M36 34v-6a12 12 0 0 1 12-12 12 12 0 0 1 12 12v6" />
          <path d="M48 42v6" />
        </>
      );
    case 'offline':
      return (
        <>
          <path d={FRAME_PATH} strokeDasharray="6 5" />
          <path d="M30 28a26 26 0 0 1 36 0" />
          <path d="M38 36a15 15 0 0 1 20 0" />
          <path d="M48 45v1" />
          <path d="M24 52L72 20" />
        </>
      );
  }
}

export function StateIllustration({ kind, className }: StateIllustrationProps): React.ReactElement {
  return (
    <span aria-hidden="true" className={className} data-state-illustration={kind}>
      <svg
        viewBox={VIEW_BOX}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-24 h-16 text-muted-foreground"
      >
        <Paths kind={kind} />
      </svg>
    </span>
  );
}
