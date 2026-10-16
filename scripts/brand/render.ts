// path: scripts/brand/render.ts
/**
 * The rasteriser that draws the brand mark.
 *
 * It draws exactly two things, because the mark is made of exactly two things:
 * a plate (a rounded rectangle) and stroked line segments with round caps. A
 * segment becomes a capsule, which is filled as a convex polygon plus two
 * circles, so the renderer never needs a general path filler and cannot
 * disagree with the SVG writer about what the outline is.
 *
 * Anti-aliasing is done by supersampling: the whole drawing is rendered at
 * four times the target size and then box filtered down. At 16 pixels, which
 * is the smallest asset in the set, that is the difference between a monogram
 * and a smudge.
 *
 * The renderer is pure: it takes the geometry and the colours and returns an
 * image. Nothing here reads a file, the clock or the environment, which is
 * what makes the generated assets byte for byte reproducible.
 */
import { BRAND_GRID, BRAND_STROKE_WIDTH, type BrandSegment } from '@/config/brand.ts';

import { blendPixel, createImage, getPixel, setPixel, type RgbaImage } from './png';

/** An RGB colour with no alpha, straight from a token. */
export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Supersampling factor: 4 means 16 samples per output pixel. */
export const SUPERSAMPLE = 4;

/** A rounded rectangle in grid units. */
export interface RoundedRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly radius: number;
}

/**
 * Fill a rounded rectangle on a supersampled plane.
 *
 * A pixel is inside when it lies inside the inner cross of the rectangle or
 * within the radius of one of the four corner circles. Testing the corners
 * this way keeps the plate's corners circular at every size instead of
 * quadratic, which is what makes a 16 pixel plate look deliberate.
 */
function fillRoundedRect(
  plane: Uint8Array,
  planeSize: number,
  rect: RoundedRect,
  scale: number,
): void {
  const { x, y, width, height, radius } = rect;
  const left = x * scale;
  const top = y * scale;
  const right = (x + width) * scale;
  const bottom = (y + height) * scale;
  const corner = Math.min(radius, Math.min(width, height) / 2) * scale;
  const innerLeft = left + corner;
  const innerRight = right - corner;
  const innerTop = top + corner;
  const innerBottom = bottom - corner;

  const fromX = Math.max(0, Math.floor(left));
  const toX = Math.min(planeSize - 1, Math.ceil(right));
  const fromY = Math.max(0, Math.floor(top));
  const toY = Math.min(planeSize - 1, Math.ceil(bottom));

  for (let py = fromY; py <= toY; py += 1) {
    for (let px = fromX; px <= toX; px += 1) {
      const cx = px + 0.5;
      const cy = py + 0.5;
      let inside = cx >= innerLeft && cx <= innerRight && cy >= top && cy <= bottom;
      if (!inside) {
        inside = cx >= left && cx <= right && cy >= innerTop && cy <= innerBottom;
      }
      if (!inside && corner > 0) {
        const centers = [
          [innerLeft, innerTop],
          [innerRight, innerTop],
          [innerLeft, innerBottom],
          [innerRight, innerBottom],
        ] as const;
        for (const [ccx, ccy] of centers) {
          const dx = cx - ccx;
          const dy = cy - ccy;
          if (dx * dx + dy * dy <= corner * corner) {
            inside = true;
            break;
          }
        }
      }
      if (inside) {
        plane[py * planeSize + px] = 1;
      }
    }
  }
}

/** Fill a circle on a supersampled plane. */
function fillCircle(
  plane: Uint8Array,
  planeSize: number,
  centerX: number,
  centerY: number,
  radius: number,
): void {
  const fromX = Math.max(0, Math.floor(centerX - radius));
  const toX = Math.min(planeSize - 1, Math.ceil(centerX + radius));
  const fromY = Math.max(0, Math.floor(centerY - radius));
  const toY = Math.min(planeSize - 1, Math.ceil(centerY + radius));
  const radiusSquared = radius * radius;
  for (let py = fromY; py <= toY; py += 1) {
    for (let px = fromX; px <= toX; px += 1) {
      const dx = px + 0.5 - centerX;
      const dy = py + 0.5 - centerY;
      if (dx * dx + dy * dy <= radiusSquared) {
        plane[py * planeSize + px] = 1;
      }
    }
  }
}

/** Fill a convex quadrilateral by scanning each row between its edges. */
function fillQuad(
  plane: Uint8Array,
  planeSize: number,
  points: readonly (readonly [number, number])[],
): void {
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  for (const [x, y] of points) {
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
  }
  const fromY = Math.max(0, Math.floor(minY));
  const toY = Math.min(planeSize - 1, Math.ceil(maxY));
  const fromX = Math.max(0, Math.floor(minX));
  const toX = Math.min(planeSize - 1, Math.ceil(maxX));

  for (let py = fromY; py <= toY; py += 1) {
    const cy = py + 0.5;
    let rowStart = Number.POSITIVE_INFINITY;
    let rowEnd = Number.NEGATIVE_INFINITY;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      if (current === undefined || next === undefined) {
        continue;
      }
      const [x1, y1] = current;
      const [x2, y2] = next;
      if (y1 === y2) {
        continue;
      }
      const lower = Math.min(y1, y2);
      const upper = Math.max(y1, y2);
      if (cy < lower || cy > upper) {
        continue;
      }
      const ratio = (cy - y1) / (y2 - y1);
      const x = x1 + ratio * (x2 - x1);
      rowStart = Math.min(rowStart, x);
      rowEnd = Math.max(rowEnd, x);
    }
    if (rowStart === Number.POSITIVE_INFINITY || rowEnd === Number.NEGATIVE_INFINITY) {
      continue;
    }
    const startX = Math.max(fromX, Math.floor(rowStart));
    const endX = Math.min(toX, Math.ceil(rowEnd));
    for (let px = startX; px <= endX; px += 1) {
      plane[py * planeSize + px] = 1;
    }
  }
}

/**
 * Draw one stroked segment as a capsule: the rectangle between the two offset
 * edges, plus a circle at each end. The joins between the segments of the D
 * bowl are covered by those circles, which is what makes an approximated arc
 * look continuous rather than faceted.
 */
function strokeSegment(
  plane: Uint8Array,
  planeSize: number,
  segment: BrandSegment,
  strokeWidth: number,
  scale: number,
): void {
  const fromX = segment.from.x * scale;
  const fromY = segment.from.y * scale;
  const toX = segment.to.x * scale;
  const toY = segment.to.y * scale;
  const half = (strokeWidth * scale) / 2;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = (-dy / length) * half;
  const normalY = (dx / length) * half;

  fillQuad(plane, planeSize, [
    [fromX + normalX, fromY + normalY],
    [toX + normalX, toY + normalY],
    [toX - normalX, toY - normalY],
    [fromX - normalX, fromY - normalY],
  ]);
  fillCircle(plane, planeSize, fromX, fromY, half);
  fillCircle(plane, planeSize, toX, toY, half);
}

/** A mask at output resolution: coverage per pixel, 0 to 255. */
type Mask = Uint8Array;

/**
 * Rasterise a drawing function into a coverage mask.
 *
 * The drawing function receives a supersampled plane and paints it with 1s;
 * this function downsamples by averaging each block of samples, which is the
 * box filter that turns the hard plane into anti-aliased coverage.
 */
function rasterise(
  size: number,
  draw: (plane: Uint8Array, planeSize: number, scale: number) => void,
): Mask {
  const planeSize = size * SUPERSAMPLE;
  const plane = new Uint8Array(planeSize * planeSize);
  draw(plane, planeSize, SUPERSAMPLE);

  const mask = new Uint8Array(size * size);
  const samples = SUPERSAMPLE * SUPERSAMPLE;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let sum = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const px = x * SUPERSAMPLE + sx;
          const py = y * SUPERSAMPLE + sy;
          sum += plane[py * planeSize + px] ?? 0;
        }
      }
      mask[y * size + x] = Math.round((sum / samples) * 255);
    }
  }
  return mask;
}

/** Paint a mask onto an image in one colour, source over. */
function paintMask(image: RgbaImage, mask: Mask, color: RgbColor): void {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const coverage = (mask[y * image.width + x] ?? 0) / 255;
      if (coverage > 0) {
        blendPixel(image, x, y, color.r, color.g, color.b, coverage);
      }
    }
  }
}

/** The mark, ready to draw: segments already scaled into grid units. */
export interface MarkGeometry {
  readonly segments: readonly BrandSegment[];
  readonly strokeWidth: number;
}

/** Options for one rendered asset. */
export interface RenderMarkOptions {
  /** Output size in pixels, square. */
  readonly size: number;
  readonly geometry: MarkGeometry;
  readonly glyphColor: RgbColor;
  /** Plate colour, or null for a transparent background. */
  readonly plateColor: RgbColor | null;
  /** Plate corner radius in grid units. */
  readonly plateRadius: number;
  /** Padding in grid units, applied to the glyph and to the plate. */
  readonly padding: number;
  /**
   * True for the maskable icon: the plate fills the whole square and only the
   * glyph is inset, so a platform that crops to a circle or a rounded square
   * never exposes a transparent corner.
   */
  readonly plateFillsSquare?: boolean;
}

/**
 * Render one asset from the mark geometry.
 *
 * The glyph is drawn inside the padding on every variant, and the plate either
 * hugs the padding (a floating mark) or fills the square (a maskable icon).
 */
export function renderMark(options: RenderMarkOptions): RgbaImage {
  const {
    size,
    geometry,
    glyphColor,
    plateColor,
    plateRadius,
    padding,
    plateFillsSquare = false,
  } = options;
  // Grid units to output pixels. Everything above this line is expressed in
  // the 32 unit grid the mark is described on; everything below it is pixels,
  // and the supersampling factor is applied on top by the rasteriser. Getting
  // these two apart is what keeps the same drawing sharp at 16 and at 512.
  const unit = size / BRAND_GRID;
  const image = createImage(size, size);

  if (plateColor !== null) {
    const inset = plateFillsSquare ? 0 : padding;
    const plateMask = rasterise(size, (plane, planeSize, scale) => {
      fillRoundedRect(
        plane,
        planeSize,
        {
          x: inset * unit,
          y: inset * unit,
          width: (BRAND_GRID - inset * 2) * unit,
          height: (BRAND_GRID - inset * 2) * unit,
          radius: (plateFillsSquare ? 0 : plateRadius) * unit,
        },
        scale,
      );
    });
    paintMask(image, plateMask, plateColor);
  }

  const glyphMask = rasterise(size, (plane, planeSize, scale) => {
    // The glyph keeps the padding on every variant, including the maskable
    // icon, which is the safe zone a crop cannot reach.
    const scaleFactor = ((BRAND_GRID - padding * 2) / BRAND_GRID) * unit;
    const offset = padding * unit;
    for (const segment of geometry.segments) {
      strokeSegment(
        plane,
        planeSize,
        {
          from: {
            x: offset + segment.from.x * scaleFactor,
            y: offset + segment.from.y * scaleFactor,
          },
          to: { x: offset + segment.to.x * scaleFactor, y: offset + segment.to.y * scaleFactor },
        },
        geometry.strokeWidth * scaleFactor,
        scale,
      );
    }
  });
  paintMask(image, glyphMask, glyphColor);

  return image;
}

/** The stroke width the mark is drawn with, in grid units. */
export const MARK_STROKE_WIDTH = BRAND_STROKE_WIDTH;

/** Copy a pixel unchanged, used by the probes to sample a rendered asset. */
export const samplePixel = getPixel;

/** Write a pixel unchanged, used by the probes to build a synthetic image. */
export const writePixel = setPixel;
