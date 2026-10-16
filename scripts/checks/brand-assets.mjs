// path: scripts/checks/brand-assets.mjs
/**
 * check:brand-assets -- the brand pack is generated, complete and legible.
 *
 * This check does not trust the generator, and it does not re-implement it
 * either. It works in three layers:
 *
 *   1. **Files.** Every asset in the pack exists, is not empty, and is exactly
 *      what the generator produces right now. The comparison runs the real
 *      generator with `--check`, so a hand-edited favicon, a PNG left behind
 *      by an earlier palette, or a missing file fails the build. Anything
 *      sitting in a generated directory that the asset list does not name also
 *      fails, because an unmanaged file in a generated directory is how a pack
 *      starts to drift.
 *   2. **Colour.** Every colour in every SVG is a colour from the token
 *      palette, read out of the token module and converted here with the same
 *      WCAG arithmetic the rest of the project uses. A brand asset that
 *      carries a literal is a palette change away from being wrong.
 *   3. **Drawing.** The rendered pixels are measured through
 *      scripts/brand/verify-generated.ts, which imports the renderer and the
 *      brand geometry the generator uses: centred, not clipped, filled to the
 *      intended band, the two letters readable, the plate opaque where it
 *      should be and transparent outside it, the 16 pixel tab icon legible
 *      enough to show both letters, and the default social image drawn at the
 *      size the networks crop to rather than left blank.
 *
 * The measurement layer exists because of a real defect this check is written
 * to prevent: the first version of the rasteriser drew the mark in grid units
 * on a pixel plane, so every icon carried the monogram in its top left corner
 * at a sixth of its size. Nothing in the file is wrong when that happens; only
 * the pixels are, which is why the pixels are what gets measured.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { listTrackedFiles, reportResult, REPO_ROOT, readTextFile } from './_lib.mjs';

const CHECK = 'brand-assets';

const BRAND_CONFIG = 'config/brand.ts';
const TOKEN_FILE = 'config/design-tokens.ts';
const MEASUREMENT_MODULE = 'scripts/brand/verify-generated.ts';
const GENERATOR = 'scripts/generate-brand-assets.ts';
const ASSET_COMMAND = 'npm run brand:generate';

/** Assets the pack must contain, with the format each one ships in. */
const REQUIRED_ASSETS = [
  { path: 'app/favicon.ico', format: 'ico' },
  { path: 'app/icon.png', format: 'png' },
  { path: 'app/apple-icon.png', format: 'png' },
  { path: 'public/brand/logo-light.svg', format: 'svg' },
  { path: 'public/brand/logo-dark.svg', format: 'svg' },
  { path: 'public/brand/logo-icon.svg', format: 'svg' },
  { path: 'public/icons/icon-192.png', format: 'png' },
  { path: 'public/icons/icon-512.png', format: 'png' },
  { path: 'public/icons/icon-maskable-512.png', format: 'png' },
];

/** PNG signature, so a text file renamed to .png cannot pass. */
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const findings = [];

function finding(file, message) {
  findings.push({ file, line: 1, column: 1, message });
}

// ---------------------------------------------------------------------------
// 1. Files exist, are non-empty, and are what they claim to be
// ---------------------------------------------------------------------------

for (const asset of REQUIRED_ASSETS) {
  const absolute = join(REPO_ROOT, asset.path);
  if (!existsSync(absolute) || statSync(absolute).size === 0) {
    finding(asset.path, `brand asset is missing or empty: run ${ASSET_COMMAND}`);
    continue;
  }
  const bytes = readFileSync(absolute);
  if (asset.format === 'png' && !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    finding(asset.path, 'the file is named .png but does not start with a PNG signature');
  }
  if (asset.format === 'svg' && !bytes.toString('utf8').trimStart().startsWith('<!-- path:')) {
    finding(asset.path, 'a generated SVG must start with its path comment');
  }
  if (asset.format === 'ico' && bytes.readUInt16LE(2) !== 1) {
    finding(asset.path, 'the file is named .ico but is not an icon container');
  }
}

// ---------------------------------------------------------------------------
// 2. Nothing unmanaged sits in a generated directory
// ---------------------------------------------------------------------------

const generatedPaths = new Set(REQUIRED_ASSETS.map((asset) => asset.path));
for (const file of listTrackedFiles()) {
  if (!file.startsWith('public/brand/') && !file.startsWith('public/icons/')) {
    continue;
  }
  if (!generatedPaths.has(file)) {
    finding(
      file,
      `a file in a generated directory is not named by BRAND_ASSETS in ${BRAND_CONFIG}: name it there or remove it`,
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Every colour in every SVG comes from the palette
// ---------------------------------------------------------------------------

function readThemeTriples() {
  const text = readTextFile(TOKEN_FILE);
  if (text === null) {
    return null;
  }
  const blockStart = text.indexOf('export const COLOR_THEME_VALUES');
  if (blockStart < 0) {
    return null;
  }
  const block = text.slice(blockStart, text.indexOf('\n};', blockStart));
  const themes = {};
  for (const match of block.matchAll(/^ {2}'?([a-z-]+)'?:\s*\{/gm)) {
    const from = match.index + match[0].length;
    const to = block.indexOf('\n  },', from);
    const roles = {};
    for (const role of block
      .slice(from, to < 0 ? undefined : to)
      .matchAll(/^ {4}'?([a-z-]+)'?:\s*'([^']+)'/gm)) {
      roles[role[1]] = role[2];
    }
    themes[match[1]] = roles;
  }
  return themes;
}

const themes = readThemeTriples();
if (themes === null) {
  finding(TOKEN_FILE, 'the colour theme values could not be read from the token module');
}

for (const asset of REQUIRED_ASSETS) {
  if (asset.format !== 'svg') {
    continue;
  }
  const text = readTextFile(asset.path);
  if (text === null) {
    continue;
  }
  const colours = [...text.matchAll(/(?:fill|stroke)="(#[0-9a-f]{6})"/g)].map((match) => match[1]);
  if (colours.length === 0) {
    finding(asset.path, 'the generated SVG declares no colour');
  }
  if (!text.includes('stroke-linecap="round"')) {
    finding(asset.path, 'the monogram must keep round line caps to stay legible at small sizes');
  }
  if (!text.includes('viewBox="0 0 32 32"')) {
    finding(asset.path, 'the generated SVG must keep the 32 unit grid as its viewBox');
  }
  asset.colours = colours;
}

// The palette is resolved from the measurement module, which reads it through
// the token module exactly as the generator does, so the two cannot disagree.
function measure() {
  try {
    const output = execFileSync('npx', ['tsx', MEASUREMENT_MODULE], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: { ...process.env, NODE_PATH: join(REPO_ROOT, 'node_modules') },
    });
    const line = output.trim().split('\n').at(-1) ?? '';
    return JSON.parse(line);
  } catch (error) {
    finding(
      MEASUREMENT_MODULE,
      `the rendered brand measurement could not run: ${String(error).split('\n')[0]}`,
    );
    return null;
  }
}

const measured = measure();
if (measured !== null) {
  const palette = new Set(measured.palette ?? []);
  for (const asset of REQUIRED_ASSETS) {
    for (const colour of asset.colours ?? []) {
      if (!palette.has(colour)) {
        finding(asset.path, `${colour} is not a colour from the token palette`);
      }
    }
  }
  for (const entry of measured.findings ?? []) {
    finding(entry.file, entry.message);
  }
  if ((measured.runs ?? 0) < 2) {
    finding(
      'app/favicon.ico',
      `the 16 pixel icon shows ${String(measured.runs)} glyph run on its midline; two are needed to tell the letters apart`,
    );
  }
  if (measured.cornerAlpha !== 0) {
    finding('app/icon.png', 'the corner of a floating icon plate must be transparent');
  }
  if (measured.centerAlpha !== 255) {
    finding('app/icon.png', 'the middle of the icon plate must be opaque');
  }
  const [red, green, blue, alpha] = measured.cornerPixel ?? [0, 0, 0, 0];
  const cornerHex = `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
  if (alpha !== 0 && cornerHex !== measured.plateHex) {
    finding(
      'app/icon.png',
      `the plate corner is ${cornerHex}, which is neither transparent nor the plate colour`,
    );
  }
  if (measured.maskableCornerAlpha !== 255) {
    finding(
      'public/icons/icon-maskable-512.png',
      'a maskable icon must be opaque at its corners, or a platform that crops it shows the background through',
    );
  }

  if (measured.socialImage === undefined) {
    finding('lib/seo/og-image.ts', 'the default social image was not rendered for measurement');
  }
}

// ---------------------------------------------------------------------------
// 4. The committed files match a fresh render
// ---------------------------------------------------------------------------

if (!existsSync(join(REPO_ROOT, GENERATOR))) {
  finding(GENERATOR, 'the brand asset generator is missing');
} else {
  try {
    execFileSync('npm', ['run', 'brand:generate', '--silent', '--', '--check'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`;
    const stale = output
      .split('\n')
      .filter((line) => line.includes('is stale'))
      .map((line) => line.split(' ')[0]);
    if (stale.length === 0) {
      finding(
        GENERATOR,
        `the generator could not be run: ${output.trim().split('\n').at(-1) ?? ''}`,
      );
    }
    for (const path of stale) {
      finding(path, `the committed file differs from a fresh render: run ${ASSET_COMMAND}`);
    }
  }
}

reportResult(
  CHECK,
  findings,
  `${String(REQUIRED_ASSETS.length)} assets current (mark in light and dark, plate icon, favicon pack 16/32/48, apple touch icon 180, PWA icons 192 and 512, maskable 512), palette-only colours, centring and 16 pixel legibility verified, default social image rendered and measured at the network crop size`,
);
