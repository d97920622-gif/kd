// path: lib/brand/mark.ts
/**
 * The brand mark as one drawing, described once.
 *
 * This project draws the monogram in four places: the SVG files the brand
 * generator writes, the PNG icons it rasterises, the React component the
 * application renders in headers and footers, and the social image built for
 * link previews. Four drawings that are supposed to be the same drawing are
 * four chances to drift, so the geometry lives in config/brand.ts and the one
 * piece of presentation this module owns is the path data that turns those
 * segments into an SVG.
 *
 * The path is built from capsule segments: each one is a straight line, and
 * the renderer that rasterises it adds the round caps. SVG gets the same shape
 * from `stroke-linecap="round"`, which is why the path carries no curves
 * itself. Every coordinate is emitted through a formatter that strips
 * trailing zeros, so the string is identical on every machine and the
 * generated files can be compared byte for byte.
 */
import {
  BRAND_GRID,
  BRAND_MARK_SEGMENTS,
  BRAND_STROKE_WIDTH,
  BRAND_VARIANTS,
  type BrandSegment,
} from '@/config/brand';

/** One number, with no exponent, no trailing zero and no minus zero. */
export function formatBrandNumber(value: number): string {
  const rounded = Number(value.toFixed(2));
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

/** Path data for a list of segments, in the 32 unit grid. */
export function brandPathData(segments: readonly BrandSegment[]): string {
  return segments
    .map(
      (segment) =>
        `M${formatBrandNumber(segment.from.x)} ${formatBrandNumber(segment.from.y)}L${formatBrandNumber(segment.to.x)} ${formatBrandNumber(segment.to.y)}`,
    )
    .join('');
}

/** The monogram, ready for a `d` attribute. */
export const BRAND_MARK_PATH = brandPathData(BRAND_MARK_SEGMENTS);

/** Stroke width in grid units, as an SVG attribute value. */
export const BRAND_MARK_STROKE = formatBrandNumber(BRAND_STROKE_WIDTH);

/** The maskable icon's plate: the whole square, cropped by the platform. */
export const BRAND_MASKABLE_PLATE = {
  x: 0,
  y: 0,
  width: BRAND_GRID,
  height: BRAND_GRID,
  radius: 0,
};

/**
 * The plate behind the icon variant, in grid units.
 *
 * Floating icons inset the plate so the mark reads as a tile with air around
 * it; the maskable icon fills the square instead, because the platform crops
 * to its own shape and anything transparent at the edge would show through as
 * a bitten corner.
 */
export const BRAND_PLATE = {
  x: BRAND_VARIANTS.icon.padding,
  y: BRAND_VARIANTS.icon.padding,
  width: BRAND_GRID - BRAND_VARIANTS.icon.padding * 2,
  height: BRAND_GRID - BRAND_VARIANTS.icon.padding * 2,
  radius: BRAND_VARIANTS.icon.plateRadius,
};

/**
 * A plate as an SVG rectangle element, for the string-based renderers.
 *
 * The glyph is drawn as a stroked path, and half its width sits outside the
 * geometry, so the plate is where the padding has to be applied. The maskable
 * plate passes `fillsSquare`.
 */
export function brandPlateElement(options: {
  readonly fillsSquare: boolean;
  readonly fill: string;
}): string {
  const plate = options.fillsSquare ? BRAND_MASKABLE_PLATE : BRAND_PLATE;
  return `<rect x="${formatBrandNumber(plate.x)}" y="${formatBrandNumber(plate.y)}" width="${formatBrandNumber(plate.width)}" height="${formatBrandNumber(plate.height)}" rx="${formatBrandNumber(plate.radius)}" fill="${options.fill}" />`;
}

/** The monogram as an SVG path element, for the string-based renderers. */
export function brandPathElement(options: {
  readonly fill: string;
  readonly opacity?: string;
}): string {
  const opacity = options.opacity === undefined ? '' : ` opacity="${options.opacity}"`;
  return `<path d="${BRAND_MARK_PATH}" fill="none" stroke="${options.fill}" stroke-width="${BRAND_MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"${opacity} />`;
}
