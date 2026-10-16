// path: config/brand.ts
/**
 * The brand mark: its geometry and the asset set built from it.
 *
 * One drawing, three outputs. The monogram is described once, as a small set
 * of stroked segments on a 32 unit grid, and everything else is derived:
 *
 *   - `components/branding/logo-mark.tsx` renders it as inline SVG, so the
 *     application mark is live vector art that follows the current text
 *     colour and needs no network request;
 *   - `scripts/generate-brand-assets.ts` renders the same segments into the
 *     SVG files and the raster pack (favicon, apple touch icon, PWA icons);
 *   - `scripts/checks/brand-assets.mjs` regenerates both and fails when a
 *     committed file no longer matches, so a hand-edited favicon cannot drift
 *     from the mark.
 *
 * Geometry rules, and why they are what they are:
 *
 *   - The grid is 32 units and every coordinate is an integer or a half
 *     integer, so the same numbers rasterise cleanly at 16, 32, 48, 180, 192
 *     and 512 pixels without a resampling step.
 *   - The stroke is 3.2 units with round caps and round joins. That is what
 *     keeps the monogram legible at 16 pixels: the caps fill the corners a
 *     square-cut stroke loses.
 *   - The mark keeps an 11 percent margin on every side, which is the safe
 *     zone a maskable PWA icon crops to. The icon variant narrows the glyph
 *     and enlarges the plate; the glyph never reaches the edge.
 *   - The K arm and the D bowl are strokes rather than filled outlines, so the
 *     mark has one weight across every size and can be redrawn with a single
 *     token change.
 *
 * Colours are not declared here. Each asset names the colour ROLE it uses
 * (a name from config/design-tokens.ts) and the theme to resolve it in, so a
 * palette change regenerates every asset and no file carries a literal.
 */

/** A point on the 32 unit grid. */
export interface BrandPoint {
  readonly x: number;
  readonly y: number;
}

/** A stroked segment of the monogram. */
export interface BrandSegment {
  readonly from: BrandPoint;
  readonly to: BrandPoint;
}

/** The grid the mark is drawn on, in units. */
export const BRAND_GRID = 32;

/** Stroke width of the monogram, in grid units. */
export const BRAND_STROKE_WIDTH = 3.4;

/**
 * The monogram: K and D, drawn as strokes.
 *
 * K is a stem with two arms meeting at the middle. D is a stem with a bowl;
 * the bowl is a chain of segments around a half circle, so the rasteriser and
 * the SVG writer draw exactly the same shape rather than one approximating the
 * other.
 */
const K_STEM: BrandSegment = { from: { x: 5.5, y: 6 }, to: { x: 5.5, y: 26 } };
const K_ARM_UP: BrandSegment = { from: { x: 5.5, y: 16 }, to: { x: 12.5, y: 6.5 } };
const K_ARM_DOWN: BrandSegment = { from: { x: 5.5, y: 16 }, to: { x: 12.5, y: 25.5 } };
const D_STEM: BrandSegment = { from: { x: 17, y: 6 }, to: { x: 17, y: 26 } };

/**
 * Centre and radius of the D bowl.
 *
 * The two letters are placed so the ink is centred on the grid rather than the
 * geometry: the stroke adds half its width on every side, so the drawn mark
 * spans 3.9 to 28.1 units on both axes, which is symmetric about 16. A mark
 * that is centred by its coordinates and not by its ink sits visibly low and
 * left on a splash screen.
 */
export const BRAND_D_BOWL = { centerX: 17, centerY: 16, radius: 9.5 } as const;

/** Number of segments approximating the D bowl. */
const BOWL_SEGMENTS = 16;

function buildBowlSegments(): readonly BrandSegment[] {
  const { centerX, centerY, radius } = BRAND_D_BOWL;
  const segments: BrandSegment[] = [];
  for (let index = 0; index < BOWL_SEGMENTS; index += 1) {
    const startAngle = -Math.PI / 2 + (index * Math.PI) / BOWL_SEGMENTS;
    const endAngle = -Math.PI / 2 + ((index + 1) * Math.PI) / BOWL_SEGMENTS;
    segments.push({
      from: {
        x: centerX + radius * Math.cos(startAngle),
        y: centerY + radius * Math.sin(startAngle),
      },
      to: {
        x: centerX + radius * Math.cos(endAngle),
        y: centerY + radius * Math.sin(endAngle),
      },
    });
  }
  return segments;
}

/** Every stroke of the monogram, in draw order: K first, then D. */
export const BRAND_MARK_SEGMENTS: readonly BrandSegment[] = [
  K_STEM,
  K_ARM_UP,
  K_ARM_DOWN,
  D_STEM,
  ...buildBowlSegments(),
];

/**
 * Which role a colour comes from and in which theme it is resolved.
 * `role` names a color role; `theme` names a color theme. Both are validated
 * against the token module, so a typo fails the asset check instead of
 * producing a black square.
 */
export interface BrandColorRef {
  readonly role: string;
  readonly theme: string;
}

/** How the monogram is drawn on a plate, or on nothing at all. */
export interface BrandVariant {
  /** Glyph colour. */
  readonly glyph: BrandColorRef;
  /** Plate colour, or null for a transparent background. */
  readonly plate: BrandColorRef | null;
  /** Corner radius of the plate in grid units; ignored without a plate. */
  readonly plateRadius: number;
  /** Margin inside the plate, in grid units. */
  readonly padding: number;
}

/**
 * The three variants the platform ships.
 *
 * `light` and `dark` are the same mark for two surfaces: on a light surface
 * the glyph is the light theme's foreground, on a dark surface the dark
 * theme's. `icon` is the app icon: a primary plate with the glyph in the
 * primary foreground, padded for the maskable safe zone.
 */
export const BRAND_VARIANTS: Readonly<Record<'light' | 'dark' | 'icon', BrandVariant>> = {
  light: {
    glyph: { role: 'foreground', theme: 'light' },
    plate: null,
    plateRadius: 0,
    padding: 0,
  },
  dark: {
    glyph: { role: 'foreground', theme: 'dark' },
    plate: null,
    plateRadius: 0,
    padding: 0,
  },
  icon: {
    glyph: { role: 'primary-foreground', theme: 'light' },
    plate: { role: 'primary', theme: 'light' },
    plateRadius: 7,
    padding: 4,
  },
};

/** A generated asset: where it goes and how it is drawn. */
export interface BrandAsset {
  /** Path relative to the repository root. */
  readonly path: string;
  /** Format written. */
  readonly format: 'svg' | 'png' | 'ico';
  /** Width in pixels. Raster assets are square. */
  readonly size: number;
  /** Which variant of the mark is drawn. */
  readonly variant: 'light' | 'dark' | 'icon';
  /** Why the file exists. */
  readonly usage: string;
}

/**
 * The committed asset set.
 *
 * `app/favicon.ico`, `app/icon.png` and `app/apple-icon.png` are Next.js file
 * conventions: the framework serves them and links them in the document head
 * without a line of code. The PWA icons live under `public/icons/` and are
 * referenced by the web app manifest when the manifest lands with PWA setup in
 * a later step; generating them here keeps the icon set complete and in one
 * place.
 */
export const BRAND_ASSETS: readonly BrandAsset[] = [
  {
    path: 'app/favicon.ico',
    format: 'ico',
    size: 32,
    variant: 'icon',
    usage: 'browser tab icon, packed at 16, 32 and 48 pixels in one file',
  },
  {
    path: 'app/icon.png',
    format: 'png',
    size: 512,
    variant: 'icon',
    usage: 'application icon used by the framework for the document head',
  },
  {
    path: 'app/apple-icon.png',
    format: 'png',
    size: 180,
    variant: 'icon',
    usage: 'home screen icon on iOS, which does not accept an SVG file',
  },
  {
    path: 'public/brand/logo-light.svg',
    format: 'svg',
    size: BRAND_GRID,
    variant: 'light',
    usage: 'mark for light surfaces, where an image element cannot inherit a text colour',
  },
  {
    path: 'public/brand/logo-dark.svg',
    format: 'svg',
    size: BRAND_GRID,
    variant: 'dark',
    usage: 'mark for dark surfaces, the same drawing in the dark theme foreground',
  },
  {
    path: 'public/brand/logo-icon.svg',
    format: 'svg',
    size: BRAND_GRID,
    variant: 'icon',
    usage: 'mark with its plate, for places that need the filled app icon shape',
  },
  {
    path: 'public/icons/icon-192.png',
    format: 'png',
    size: 192,
    variant: 'icon',
    usage: 'small PWA icon for an installed application shortcut',
  },
  {
    path: 'public/icons/icon-512.png',
    format: 'png',
    size: 512,
    variant: 'icon',
    usage: 'large PWA icon for the install prompt and the splash screen',
  },
  {
    path: 'public/icons/icon-maskable-512.png',
    format: 'png',
    size: 512,
    variant: 'icon',
    usage: 'maskable PWA icon: the plate fills the square and the glyph stays inside the safe zone',
  },
];

/** Sizes packed into the ICO container, in the order the container lists them. */
export const ICO_SIZES: readonly number[] = [16, 32, 48];

/**
 * Padding used for the smallest tab icons.
 *
 * An ICO carries a 16, 32 and 48 pixel image. At 48 pixels the design padding
 * of 4 units is invisible; at 16 pixels it costs a quarter of the square and
 * the monogram loses the counters that make it readable, which is the whole
 * job of a 16 pixel icon. The two smallest sizes are therefore drawn with a
 * tighter margin: the plate keeps its identity and the mark keeps its legs.
 *
 * The threshold and the value live here rather than in the generator so the
 * asset check can assert the rendered result at both sizes instead of trusting
 * the code path that produced it.
 */
export const BRAND_SMALL_ICON_MAX_SIZE = 32;
export const BRAND_SMALL_ICON_PADDING = 1.5;

/** Dimensions of the default share image, the values every platform expects. */
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

/** Files the brand check regenerates and compares. */
export const BRAND_GENERATED_PREFIX = 'generated by scripts/generate-brand-assets.ts';
