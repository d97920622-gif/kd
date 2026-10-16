// path: scripts/export-design-tokens.ts
/**
 * Design token export: `npm run tokens:export`.
 *
 * Writes config/design-tokens.json from config/design-tokens.ts for design
 * tooling, documentation and any downstream consumer that cannot read
 * TypeScript. The file is deterministic: same tokens, same bytes, no
 * timestamps and no environment values, so `npm run verify` can prove the
 * committed JSON is current with `--check`.
 *
 * The export is the whole token surface: scales, typography, motion, the four
 * color themes, the contrast contract and the paper palette. A consumer that
 * reads this file sees exactly what a component sees.
 *
 * Exit codes:
 *   0  file written, or the file is already current in --check mode
 *   1  --check found the file missing or stale, or validation failed
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  COLOR_ROLES,
  COLOR_ROLE_CSS_VARIABLES,
  COLOR_THEME_NAMES,
  COLOR_THEME_VALUES,
  CONTRAST_MINIMUMS,
  CONTRAST_PAIRS,
  DECORATIVE_BORDER_NOTE,
  FONT_FAMILY_TOKENS,
  FONT_SIZE_TOKENS,
  FONT_WEIGHT_TOKENS,
  HIGH_CONTRAST_TEXT_MINIMUM,
  LAYOUT_WIDTH_TOKENS,
  MINIMUM_BODY_TEXT_PX,
  MOTION_DURATION_TOKENS,
  MOTION_EASING_TOKENS,
  PRINT_CONTRAST_PAIRS,
  PRINT_PAGE_MARGIN_MM,
  PRINT_ROLE_MAP,
  PRINT_TOKENS,
  RADIUS_TOKENS,
  SAFE_AREA_TOKENS,
  SHADOW_TOKENS,
  SPACING_SCALE_TOKENS,
  SPACING_SUPPORT_TOKENS,
  SPACING_UNIT_PX,
  Z_INDEX_TOKENS,
} from '../config/design-tokens.ts';

/** Path of the generated file, relative to the repository root. */
const OUTPUT_FILE = 'config/design-tokens.json';

/** The step that owns this artefact, recorded inside the file. */
const OWNING_STEP = 'step-01/1.14';

function write(line: string): void {
  process.stdout.write(`${line}\n`);
}

/** Build the export object in a fixed key order so the bytes are stable. */
function buildExport(): Record<string, unknown> {
  return {
    meta: {
      source: 'config/design-tokens.ts',
      generator: 'npm run tokens:export',
      owning_step: OWNING_STEP,
      format: 'w3c-design-tokens-inspired',
      notes: [
        'Generated file: never edit by hand, run npm run tokens:export instead.',
        'Color values are HSL channel triples in the form "hue saturation% lightness%".',
        'Every theme declares every color role; there is no partial theme.',
        DECORATIVE_BORDER_NOTE,
      ],
    },
    spacing: {
      unit_px: SPACING_UNIT_PX,
      scale: SPACING_SCALE_TOKENS,
      support: SPACING_SUPPORT_TOKENS,
    },
    layout_width: LAYOUT_WIDTH_TOKENS,
    safe_area: SAFE_AREA_TOKENS,
    radius: RADIUS_TOKENS,
    shadow: SHADOW_TOKENS,
    z_index: Z_INDEX_TOKENS,
    typography: {
      minimum_body_text_px: MINIMUM_BODY_TEXT_PX,
      size: FONT_SIZE_TOKENS,
      weight: FONT_WEIGHT_TOKENS,
      family: FONT_FAMILY_TOKENS,
    },
    motion: {
      duration: MOTION_DURATION_TOKENS,
      easing: MOTION_EASING_TOKENS,
      reduced_motion: {
        strategy: 'durations collapse to zero, layout and information unchanged',
        media_query: '(prefers-reduced-motion: reduce)',
      },
    },
    color: {
      themes: COLOR_THEME_NAMES,
      variables: COLOR_ROLE_CSS_VARIABLES,
      roles: COLOR_ROLES,
      values: COLOR_THEME_VALUES,
      media_queries: {
        high_contrast: '(prefers-contrast: more)',
        forced_colors: '(forced-colors: active)',
      },
    },
    contrast: {
      minimums: CONTRAST_MINIMUMS,
      high_contrast_text_minimum: HIGH_CONTRAST_TEXT_MINIMUM,
      pairs: CONTRAST_PAIRS,
    },
    print: {
      page_margin_mm: PRINT_PAGE_MARGIN_MM,
      palette: PRINT_TOKENS,
      role_map: PRINT_ROLE_MAP,
      contrast_pairs: PRINT_CONTRAST_PAIRS,
      note: 'The paper palette is fixed for every theme: printing does not follow the reader theme.',
    },
  };
}

/**
 * Every group must be present and non-empty. A generator that silently
 * exports an empty group would ship a broken file that looks valid.
 */
function validateExport(exported: Record<string, unknown>): string[] {
  const problems: string[] = [];
  const groups: Record<string, unknown> = {
    'spacing.scale': SPACING_SCALE_TOKENS,
    'spacing.support': SPACING_SUPPORT_TOKENS,
    layout_width: LAYOUT_WIDTH_TOKENS,
    safe_area: SAFE_AREA_TOKENS,
    radius: RADIUS_TOKENS,
    shadow: SHADOW_TOKENS,
    z_index: Z_INDEX_TOKENS,
    'typography.size': FONT_SIZE_TOKENS,
    'typography.weight': FONT_WEIGHT_TOKENS,
    'typography.family': FONT_FAMILY_TOKENS,
    'motion.duration': MOTION_DURATION_TOKENS,
    'motion.easing': MOTION_EASING_TOKENS,
    'color.roles': COLOR_ROLES,
    'color.values': COLOR_THEME_VALUES,
    'contrast.pairs': CONTRAST_PAIRS,
    'print.palette': PRINT_TOKENS,
    'print.role_map': PRINT_ROLE_MAP,
    'print.contrast_pairs': PRINT_CONTRAST_PAIRS,
  };
  for (const [name, group] of Object.entries(groups)) {
    const size = Array.isArray(group) ? group.length : Object.keys(group as object).length;
    if (size === 0) {
      problems.push(`group ${name} is empty`);
    }
  }
  if (COLOR_THEME_NAMES.length !== Object.keys(COLOR_THEME_VALUES).length) {
    problems.push('a theme in COLOR_THEME_NAMES has no values');
  }
  for (const theme of COLOR_THEME_NAMES) {
    const roleCount = Object.keys(COLOR_THEME_VALUES[theme]).length;
    if (roleCount !== Object.keys(COLOR_ROLES).length) {
      problems.push(
        `theme ${theme} declares ${roleCount} of ${Object.keys(COLOR_ROLES).length} roles`,
      );
    }
  }
  const serialized = JSON.stringify(exported);
  if (serialized.length < 1000) {
    problems.push('the serialized export is suspiciously small');
  }
  return problems;
}

function main(): void {
  const root = process.cwd();
  const checkOnly = process.argv.includes('--check');
  const exported = buildExport();
  const problems = validateExport(exported);
  if (problems.length > 0) {
    for (const problem of problems) {
      process.stderr.write(`tokens:export ${problem}\n`);
    }
    process.stderr.write('tokens:export FAIL (the token module did not validate)\n');
    process.exitCode = 1;
    return;
  }

  const serialized = `${JSON.stringify(exported, null, 2)}\n`;
  const target = join(root, OUTPUT_FILE);

  if (checkOnly) {
    let current: string | null = null;
    try {
      current = readFileSync(target, 'utf8');
    } catch {
      current = null;
    }
    if (current === null) {
      process.stderr.write(
        `tokens:export FAIL (${OUTPUT_FILE} is missing; run npm run tokens:export and commit the result)\n`,
      );
      process.exitCode = 1;
      return;
    }
    if (current !== serialized) {
      process.stderr.write(
        `tokens:export FAIL (${OUTPUT_FILE} is stale; run npm run tokens:export and commit the result)\n`,
      );
      process.exitCode = 1;
      return;
    }
    write(
      `tokens:export PASS (${OUTPUT_FILE} is current: ${Object.keys(exported).length} groups, ${serialized.length} bytes)`,
    );
    return;
  }

  writeFileSync(target, serialized, 'utf8');
  write(
    `tokens:export PASS (wrote ${OUTPUT_FILE}: ${Object.keys(exported).length} groups, ${serialized.length} bytes)`,
  );
}

main();
