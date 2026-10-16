// path: scripts/brand/verify-generated.ts
/**
 * The verification half of check:brand-assets.
 *
 * The check runs as a plain Node script so it can use the shared walker and
 * reporter the other checks use, but the geometry it verifies is expressed in
 * TypeScript and imports through the `@/` alias. This module is the bridge:
 * the script spawns it, it imports the renderer and the token module exactly
 * as the generator does, verifies the rendered pixels, and prints one line of
 * JSON that the script turns into findings.
 *
 * It lives next to the renderer rather than in the check directory because it
 * is part of the brand toolchain: it needs the same alias resolution, and it
 * must verify the renderer the generator actually uses rather than a second
 * copy of it.
 */
import { inflateSync } from 'node:zlib';

import {
  BRAND_MARK_SEGMENTS,
  BRAND_SMALL_ICON_PADDING,
  BRAND_STROKE_WIDTH,
  BRAND_VARIANTS,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '@/config/brand.ts';
import { COLOR_THEME_VALUES } from '@/config/design-tokens.ts';
import { renderDefaultOgImage } from '@/lib/seo/og-image.ts';
import { hslToRgb, parseHslTriple, rgbToHex } from '@/lib/utils/color.ts';

import { renderMark } from './render.ts';

interface Finding {
  readonly file: string;
  readonly message: string;
}

const findings: Finding[] = [];
const geometry = { segments: BRAND_MARK_SEGMENTS, strokeWidth: BRAND_STROKE_WIDTH };

function rgbOf(role: string, theme: string): { r: number; g: number; b: number } {
  const triple = COLOR_THEME_VALUES[theme as keyof typeof COLOR_THEME_VALUES]?.[role];
  if (triple === undefined) {
    findings.push({
      file: 'config/brand.ts',
      message: `unknown colour reference ${role} in ${theme}`,
    });
    return { r: 0, g: 0, b: 0 };
  }
  return hslToRgb(parseHslTriple(triple));
}

function hexOf(role: string, theme: string): string {
  const color = rgbOf(role, theme);
  return rgbToHex(color);
}

/** Runs expected on the midline of the full mark: K, D stem, D bowl. */
const MIDLINE_RUNS = 3;

/** Number of separate ink runs along one row: the shape measure of letters. */
function countRuns(data: Uint8Array, width: number, y: number, hex: string): number {
  let runs = 0;
  let inside = false;
  for (let x = 0; x < width; x += 1) {
    const ink = isInk(data, width, x, y, hex);
    if (ink && !inside) {
      runs += 1;
      inside = true;
    } else if (!ink) {
      inside = false;
    }
  }
  return runs;
}

function isInk(data: Uint8Array, width: number, x: number, y: number, hex: string): boolean {
  const offset = (y * width + x) * 4;
  if ((data[offset + 3] ?? 0) < 200) {
    return false;
  }
  const pixel = `#${[data[offset] ?? 0, data[offset + 1] ?? 0, data[offset + 2] ?? 0]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')}`;
  return pixel === hex;
}

// --- centring, clipping and fill band, on the transparent variant at 64px ---

const lightHex = hexOf(BRAND_VARIANTS.light.glyph.role, BRAND_VARIANTS.light.glyph.theme);
const light = renderMark({
  size: 64,
  geometry,
  glyphColor: rgbOf(BRAND_VARIANTS.light.glyph.role, BRAND_VARIANTS.light.glyph.theme),
  plateColor: null,
  plateRadius: 0,
  padding: 0,
});

let minX = 64;
let maxX = -1;
let minY = 64;
let maxY = -1;
for (let y = 0; y < 64; y += 1) {
  for (let x = 0; x < 64; x += 1) {
    if (isInk(light.data, 64, x, y, lightHex)) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
}

if (maxX < 0) {
  findings.push({ file: 'config/brand.ts', message: 'the monogram renders nothing at all' });
} else {
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const tolerance = 2;
  if (Math.abs(minX - (63 - maxX)) > tolerance) {
    findings.push({
      file: 'config/brand.ts',
      message: `the monogram is not horizontally centred: ink spans ${String(minX)} to ${String(maxX)} of 64`,
    });
  }
  if (Math.abs(minY - (63 - maxY)) > tolerance) {
    findings.push({
      file: 'config/brand.ts',
      message: `the monogram is not vertically centred: ink spans ${String(minY)} to ${String(maxY)} of 64`,
    });
  }
  if (minX < 1 || minY < 1 || maxX > 62 || maxY > 62) {
    findings.push({
      file: 'config/brand.ts',
      message: 'the monogram touches the canvas edge, so it would be clipped',
    });
  }
  if (width < 46 || width > 62 || height < 46 || height > 62) {
    findings.push({
      file: 'config/brand.ts',
      message: `the monogram fills ${String(width)}x${String(height)} of 64, outside the intended 46 to 62 band`,
    });
  }

  // Three runs on the midline is what a readable K and a D with an open
  // counter look like: the K with its arm, the D stem, and the D bowl. Two
  // letters drawn as one mass show a single run; a D whose counter closed up
  // shows two.
  const midlineRuns = countRuns(light.data, 64, 32, lightHex);
  if (midlineRuns < MIDLINE_RUNS) {
    findings.push({
      file: 'config/brand.ts',
      message: `the midline of the mark shows ${String(midlineRuns)} ink runs; ${String(MIDLINE_RUNS)} are needed for the two letters and the D counter`,
    });
  }
}

// --- legibility of the 16 pixel tab icon ---

const iconGlyphHex = hexOf(BRAND_VARIANTS.icon.glyph.role, BRAND_VARIANTS.icon.glyph.theme);
const small = renderMark({
  size: 16,
  geometry,
  glyphColor: rgbOf(BRAND_VARIANTS.icon.glyph.role, BRAND_VARIANTS.icon.glyph.theme),
  plateColor: rgbOf(BRAND_VARIANTS.icon.plate!.role, BRAND_VARIANTS.icon.plate!.theme),
  plateRadius: BRAND_VARIANTS.icon.plateRadius,
  padding: BRAND_SMALL_ICON_PADDING,
});
const runs = countRuns(small.data, 16, 8, iconGlyphHex);

// --- plate coverage, on the shipped 512 pixel icon ---

const plate = renderMark({
  size: 512,
  geometry,
  glyphColor: rgbOf(BRAND_VARIANTS.icon.glyph.role, BRAND_VARIANTS.icon.glyph.theme),
  plateColor: rgbOf(BRAND_VARIANTS.icon.plate!.role, BRAND_VARIANTS.icon.plate!.theme),
  plateRadius: BRAND_VARIANTS.icon.plateRadius,
  padding: BRAND_VARIANTS.icon.padding,
});
const cornerAlpha = plate.data[3] ?? 0;
const centerAlpha = plate.data[(256 * 512 + 256) * 4 + 3] ?? 0;
const plateHex = hexOf(BRAND_VARIANTS.icon.plate!.role, BRAND_VARIANTS.icon.plate!.theme);
const cornerOffset = ((512 - 60) * 512 + 60) * 4;
const cornerPixel = plate.data.slice(cornerOffset, cornerOffset + 4);

const maskable = renderMark({
  size: 192,
  geometry,
  glyphColor: rgbOf(BRAND_VARIANTS.icon.glyph.role, BRAND_VARIANTS.icon.glyph.theme),
  plateColor: rgbOf(BRAND_VARIANTS.icon.plate!.role, BRAND_VARIANTS.icon.plate!.theme),
  plateRadius: BRAND_VARIANTS.icon.plateRadius,
  padding: BRAND_VARIANTS.icon.padding,
  plateFillsSquare: true,
});

// --- the default social image, rendered exactly as a route renders it ---

interface PngSummary {
  readonly width: number;
  readonly height: number;
  readonly bytes: number;
  readonly inflatedBytes: number;
  readonly distinctBytes: number;
  readonly signature: boolean;
}

/**
 * Summarise a PNG without decoding it.
 *
 * The social image is produced at request time and never committed, so there is
 * no file to compare against and no second renderer to check it with. What can
 * be established cheaply and honestly is: the file is a PNG, its header says
 * 1200 by 630, and the compressed pixel data expands to a full-size frame with
 * a wide spread of byte values. A blank frame also expands to a full-size
 * frame, but it expands to almost no distinct bytes, because a single colour
 * repeated is what compresses best - so the second number is what separates an
 * image that was drawn from an image that was not.
 */
function summarisePng(bytes: Uint8Array): PngSummary {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const signature =
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const width = view.getUint32(16);
  const height = view.getUint32(20);

  const parts: Buffer[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4] ?? 0,
      bytes[offset + 5] ?? 0,
      bytes[offset + 6] ?? 0,
      bytes[offset + 7] ?? 0,
    );
    if (type === 'IDAT') {
      parts.push(Buffer.from(bytes.subarray(offset + 8, offset + 8 + length)));
    }
    offset += 12 + length;
  }

  let inflatedBytes = 0;
  let distinctBytes = 0;
  if (parts.length > 0) {
    const inflated = inflateSync(Buffer.concat(parts));
    inflatedBytes = inflated.length;
    const seen = new Set<number>();
    for (const value of inflated) {
      seen.add(value);
    }
    distinctBytes = seen.size;
  }

  return { width, height, bytes: bytes.length, inflatedBytes, distinctBytes, signature };
}

async function main(): Promise<void> {
  const socialImage = summarisePng(await renderDefaultOgImage());
  if (!socialImage.signature) {
    findings.push({ file: 'lib/seo/og-image.ts', message: 'the social image is not a PNG' });
  }
  if (socialImage.width !== OG_IMAGE_WIDTH || socialImage.height !== OG_IMAGE_HEIGHT) {
    findings.push({
      file: 'lib/seo/og-image.ts',
      message: `the social image is ${String(socialImage.width)}x${String(socialImage.height)}; the networks crop to ${String(OG_IMAGE_WIDTH)}x${String(OG_IMAGE_HEIGHT)}`,
    });
  }
  if (socialImage.inflatedBytes < OG_IMAGE_WIDTH * OG_IMAGE_HEIGHT) {
    findings.push({
      file: 'lib/seo/og-image.ts',
      message:
        'the social image carries less pixel data than one full frame, so it cannot have been drawn',
    });
  }
  if (socialImage.distinctBytes < 40) {
    findings.push({
      file: 'lib/seo/og-image.ts',
      message: `the social image uses ${String(socialImage.distinctBytes)} distinct byte values, which is a blank frame rather than a drawing`,
    });
  }

  process.stdout.write(
    `${JSON.stringify({
      socialImage,
      findings,
      ink: { minX, maxX, minY, maxY },
      runs,
      cornerAlpha,
      centerAlpha,
      plateHex,
      cornerPixel: [...cornerPixel],
      maskableCornerAlpha: maskable.data[3] ?? 0,
      palette: Object.values(COLOR_THEME_VALUES).flatMap((roles) =>
        Object.values(roles).map((triple) => rgbToHex(hslToRgb(parseHslTriple(triple)))),
      ),
    })}\n`,
  );
}

void main().catch((error: unknown) => {
  process.stderr.write(`the brand measurement failed: ${String(error)}\n`);
  process.exitCode = 1;
});
