// path: scripts/generate-brand-assets.ts
/**
 * Generate the brand assets from one drawing.
 *
 * The mark is described once, in config/brand.ts, and this script writes every
 * shipped file from it in three formats:
 *
 *   - SVG for the web, where the mark must stay sharp at any size;
 *   - PNG for the places that cannot take an SVG (iOS home screen icons, the
 *     web app manifest, an install prompt);
 *   - ICO for the browser tab, packed from the same PNG pixels.
 *
 * The script is deterministic. The same geometry and the same palette produce
 * the same bytes on any machine, which is what lets `--check` compare the
 * committed files with a fresh render and fail when one of them was edited by
 * hand. That is the same contract as `npm run tokens:export --check`: a
 * generated artefact is never hand maintained.
 *
 * Colours are never literals here. Each variant names a colour role and the
 * theme to resolve it in, and the value is read from config/design-tokens.ts,
 * so changing the palette and re-running this script updates the favicon, the
 * app icon, the maskable icon and the logo files together.
 *
 * Usage:
 *   npm run brand:generate          write the assets
 *   npm run brand:generate -- --check    report drift and exit non-zero
 *   npm run brand:generate -- --report --check --json
 *                                        print a machine readable summary
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BRAND_ASSETS,
  BRAND_GRID,
  BRAND_SMALL_ICON_MAX_SIZE,
  BRAND_SMALL_ICON_PADDING,
  BRAND_MARK_SEGMENTS,
  BRAND_STROKE_WIDTH,
  BRAND_VARIANTS,
  ICO_SIZES,
  type BrandAsset,
  type BrandColorRef,
  type BrandSegment,
} from '@/config/brand.ts';
import { COLOR_THEME_VALUES } from '@/config/design-tokens.ts';
import { hslToRgb, parseHslTriple, rgbToHex, type Rgb } from '@/lib/utils/color.ts';

import { encodeIco, encodePng, getPixel, type IcoEntry, type RgbaImage } from './brand/png.ts';
import { renderMark, type MarkGeometry, type RgbColor } from './brand/render.ts';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

interface AssetReport {
  readonly path: string;
  readonly format: string;
  readonly bytes: number;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
  readonly colors: readonly string[];
  readonly stale: boolean;
}

const MARK_GEOMETRY: MarkGeometry = {
  segments: BRAND_MARK_SEGMENTS,
  strokeWidth: BRAND_STROKE_WIDTH,
};

/** Resolve a colour reference to RGB through the token module. */
function resolveColor(reference: BrandColorRef): Rgb {
  const theme = COLOR_THEME_VALUES[reference.theme as keyof typeof COLOR_THEME_VALUES];
  if (theme === undefined) {
    throw new RangeError(`Brand asset names an unknown colour theme: ${reference.theme}`);
  }
  const triple = theme[reference.role];
  if (triple === undefined) {
    throw new RangeError(`Brand asset names an unknown colour role: ${reference.role}`);
  }
  return hslToRgb(parseHslTriple(triple));
}

function toRenderColor(color: Rgb): RgbColor {
  return { r: color.r, g: color.g, b: color.b };
}

/** Format a coordinate: at most two decimals, no trailing zeros. */
function formatNumber(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * The glyph as one path with one subpath per segment.
 *
 * Every segment is written as its own `M ... L ...` pair rather than chaining
 * the bowl into a polyline: the rasteriser draws capsules with round caps, and
 * a subpath per segment gives the SVG the same round caps and round joins, so
 * the two renderers agree.
 */
function glyphPathData(segments: readonly BrandSegment[]): string {
  const parts: string[] = [];
  for (const segment of segments) {
    parts.push(
      `M${formatNumber(segment.from.x)} ${formatNumber(segment.from.y)}L${formatNumber(segment.to.x)} ${formatNumber(segment.to.y)}`,
    );
  }
  return parts.join('');
}

/** Write one SVG asset. */
function renderSvg(asset: BrandAsset): string {
  const variant = BRAND_VARIANTS[asset.variant];
  const glyphHex = rgbToHex(resolveColor(variant.glyph));
  const plateHex = variant.plate === null ? null : rgbToHex(resolveColor(variant.plate));
  const size = BRAND_GRID;
  const inset = variant.padding;
  const plateWidth = size - inset * 2;

  const lines: string[] = [];
  lines.push(`<!-- path: ${asset.path} -->`);
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(size)} ${String(size)}" width="${String(size)}" height="${String(size)}" role="img" aria-label="KD SOLUTION IT">`,
  );
  lines.push(`  <title>KD SOLUTION IT</title>`);
  if (plateHex !== null) {
    lines.push(
      `  <rect x="${formatNumber(inset)}" y="${formatNumber(inset)}" width="${formatNumber(plateWidth)}" height="${formatNumber(plateWidth)}" rx="${formatNumber(variant.plateRadius)}" fill="${plateHex}" />`,
    );
  }
  lines.push(
    `  <path d="${glyphPathData(BRAND_MARK_SEGMENTS)}" fill="none" stroke="${glyphHex}" stroke-width="${formatNumber(BRAND_STROKE_WIDTH)}" stroke-linecap="round" stroke-linejoin="round" />`,
  );
  lines.push('</svg>');
  lines.push('');
  return lines.join('\n');
}

/**
 * Render one PNG asset.
 *
 * `size` is normally the asset's own size. The ICO container is the one caller
 * that passes a smaller size, because it packs three images of the same
 * drawing, and those are the sizes that take the tighter small icon padding.
 */
function renderPng(asset: BrandAsset, size: number): RgbaImage {
  const variant = BRAND_VARIANTS[asset.variant];
  const isSmall = size <= BRAND_SMALL_ICON_MAX_SIZE;
  return renderMark({
    size,
    geometry: MARK_GEOMETRY,
    glyphColor: toRenderColor(resolveColor(variant.glyph)),
    plateColor: variant.plate === null ? null : toRenderColor(resolveColor(variant.plate)),
    plateRadius: variant.plateRadius,
    padding: isSmall ? BRAND_SMALL_ICON_PADDING : variant.padding,
    plateFillsSquare: asset.path.includes('maskable'),
  });
}

/** Every distinct opaque colour in an image, as hex, for the report. */
function colorsOf(image: RgbaImage): string[] {
  const seen = new Set<string>();
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const [red, green, blue, alpha] = getPixel(image, x, y);
      if (alpha === 0) {
        continue;
      }
      seen.add(
        `${rgbToHex({ r: red, g: green, b: blue })}@${String(Math.round((alpha / 255) * 100))}`,
      );
    }
  }
  return [...seen].sort();
}

interface RenderedAsset {
  readonly asset: BrandAsset;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly colors: readonly string[];
}

/** Render every asset in memory. */
function renderAll(): RenderedAsset[] {
  return BRAND_ASSETS.map((asset) => {
    if (asset.format === 'svg') {
      const text = renderSvg(asset);
      return {
        asset,
        bytes: new TextEncoder().encode(text),
        width: BRAND_GRID,
        height: BRAND_GRID,
        colors: [],
      };
    }
    if (asset.format === 'png') {
      const image = renderPng(asset, asset.size);
      return {
        asset,
        bytes: encodePng(image),
        width: image.width,
        height: image.height,
        colors: colorsOf(image),
      };
    }
    const rendered = ICO_SIZES.map((size) => {
      const image = renderPng(asset, size);
      return { size, png: encodePng(image), image };
    });
    const entries: IcoEntry[] = rendered.map(({ size, png }) => ({ size, png }));
    return {
      asset,
      bytes: encodeIco(entries),
      width: asset.size,
      height: asset.size,
      colors: [...new Set(rendered.flatMap((entry) => colorsOf(entry.image)))].sort(),
    };
  });
}

function main(): void {
  const args = new Set(process.argv.slice(2));
  const checkOnly = args.has('--check');
  const report = args.has('--report');

  const rendered = renderAll();
  const summaries: AssetReport[] = [];
  const stale: string[] = [];
  let written = 0;

  for (const entry of rendered) {
    const absolute = join(REPO_ROOT, entry.asset.path);
    const existing = existsSync(absolute) ? readFileSync(absolute) : null;
    const matches =
      existing !== null &&
      existing.length === entry.bytes.length &&
      Buffer.from(entry.bytes).equals(existing);

    if (!matches) {
      stale.push(entry.asset.path);
      if (!checkOnly) {
        mkdirSync(dirname(absolute), { recursive: true });
        writeFileSync(absolute, entry.bytes);
        written += 1;
      }
    }

    summaries.push({
      path: entry.asset.path,
      format: entry.asset.format,
      bytes: entry.bytes.length,
      width: entry.width,
      height: entry.height,
      sha256: createHash('sha256').update(entry.bytes).digest('hex').slice(0, 16),
      colors: entry.colors,
      stale: !matches,
    });
  }

  if (report) {
    process.stdout.write(
      `${JSON.stringify({ root: relative(process.cwd(), REPO_ROOT), assets: summaries })}\n`,
    );
  }

  if (checkOnly) {
    if (stale.length === 0) {
      process.stdout.write(
        `brand:generate PASS (${String(rendered.length)} assets are current: ${rendered.map((entry) => entry.asset.path).join(', ')})\n`,
      );
      return;
    }
    for (const path of stale) {
      process.stdout.write(`${path} is stale: run npm run brand:generate\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `brand:generate PASS (${String(written)} of ${String(rendered.length)} assets written, ${String(rendered.length - written)} already current)\n`,
  );
}

main();
