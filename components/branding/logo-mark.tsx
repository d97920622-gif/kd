// path: components/branding/logo-mark.tsx
import { BRAND_MARK_PATH, BRAND_MARK_STROKE, BRAND_PLATE } from '@/lib/brand/mark';
import { cn } from '@/lib/utils/cn';

/**
 * LogoMark: the monogram, drawn from the same geometry as the brand files.
 *
 * Why a component rather than an image tag. The logo appears in headers,
 * footers, sidebars, emails and the social image, at sizes from 16 pixels to
 * a splash screen, on backgrounds from the lightest surface to the darkest.
 * A fixed image cannot follow either the text colour it sits next to or the
 * theme in force, and a theme change should not require re-exporting artwork.
 * This component renders the mark as SVG on the current text colour, so it is
 * always the colour the surrounding typography already resolved to, in light,
 * dark, high contrast and print alike.
 *
 * Two variants, one drawing:
 *   - `glyph` is the wordmark on its own, for a light or dark surface where
 *     the plate would only add noise. It inherits `color`.
 *   - `plate` is the tile, for the places an icon has to hold its own square:
 *     a collapsed sidebar, a favicon-like slot, a print header. The plate uses
 *     the primary surface roles, so it stays legible in every theme without a
 *     second asset per theme.
 *
 * Accessibility. A logo is usually decoration next to a heading that already
 * names the product, and a screen reader that announces "KD SOLUTION IT" in
 * the header and again in the logo is worse than one that does not. So the
 * default is decorative: `aria-hidden`, not focusable, nothing announced. A
 * caller that uses the mark as the only name of a region passes a `title`, and
 * the mark becomes an image with that accessible name.
 */
export interface LogoMarkProps {
  /** Edge length in pixels. The mark is square. */
  readonly size?: number;
  /** `glyph` follows the text colour, `plate` carries its own tile. */
  readonly variant?: 'glyph' | 'plate';
  /**
   * Accessible name. Omit when adjacent text already names the product, which
   * is the common case; pass it when the mark carries the name on its own.
   */
  readonly title?: string;
  /** Extra classes, for layout only. */
  readonly className?: string;
}

export function LogoMark({
  size = 32,
  variant = 'glyph',
  title,
  className,
}: LogoMarkProps): React.JSX.Element {
  const labelled = title !== undefined && title.length > 0;
  return (
    <svg
      className={cn('shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={labelled ? 'img' : 'presentation'}
      aria-hidden={labelled ? undefined : true}
      focusable="false"
      data-variant={variant}
    >
      {labelled ? <title>{title}</title> : null}
      {variant === 'plate' ? (
        <rect
          x={BRAND_PLATE.x}
          y={BRAND_PLATE.y}
          width={BRAND_PLATE.width}
          height={BRAND_PLATE.height}
          rx={BRAND_PLATE.radius}
          className="fill-primary"
        />
      ) : null}
      <path
        d={BRAND_MARK_PATH}
        fill="none"
        strokeWidth={BRAND_MARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(variant === 'plate' ? 'stroke-primary-foreground' : 'stroke-current')}
      />
    </svg>
  );
}
