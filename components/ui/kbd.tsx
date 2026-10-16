// path: components/ui/kbd.tsx
import { cn } from '@/lib/utils/cn';
import { chordLabels } from '@/lib/utils/key-chord';

/**
 * Keycap and chord: how a keyboard shortcut is shown.
 *
 * A shortcut written as text - "Ctrl+K" - reads as one word, and the reader who
 * is scanning a table of them cannot tell where one key ends and the next
 * begins. A keycap is the shape a keyboard key has, and a chord is a row of
 * keycaps, which is why this is a component and not a string.
 *
 * Two decisions, both about a reader who is not looking at it:
 *
 *   - The keycaps are marked `aria-hidden`, and the chord is announced by the
 *     control it belongs to through `aria-keyshortcuts`. A screen reader
 *     reading "Control, plus, K" out of a decorative row is noise; the
 *     attribute is what assistive technology actually reads, and
 *     `lib/utils/key-chord.ts` produces it from the same chord.
 *   - The label is ASCII: `Ctrl`, not the Command glyph. The glyph is the
 *     macOS spelling of a chord that also works with Control, and rendering
 *     the right one requires reading the platform in the browser - which
 *     produces a different first paint on the server and the client. The
 *     shortcuts page carries the sentence that names both keys instead.
 */
export interface KbdProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function Kbd({ children, className }: KbdProps): React.ReactElement {
  return (
    <kbd
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

export interface KeyChordProps {
  /** A chord in canonical form: `mod+k`, `?`, `escape`. */
  readonly chord: string;
  readonly className?: string;
}

export function KeyChord({ chord, className }: KeyChordProps): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      data-chord={chord}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {chordLabels(chord).map((label) => (
        <Kbd key={label}>{label}</Kbd>
      ))}
    </span>
  );
}
