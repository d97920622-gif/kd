// path: lib/utils/color.ts
/**
 * Colour conversion and WCAG measurement.
 *
 * The design system stores every colour as an HSL channel triple, because
 * that is the form the CSS variables need: a utility such as `bg-primary` and
 * its opacity modifier both depend on the channels being separate values
 * rather than one composed colour. A canvas, a static image or a meta tag
 * cannot read a CSS variable,
 * so anything that draws outside the stylesheet (a favicon, a share image, a
 * document theme colour) needs the concrete hex of a role.
 *
 * Two rules hold for that conversion:
 *
 *   1. The value is computed, never typed. Every hex produced here comes from
 *      the token module, so a palette change reaches the generated images. A
 *      literal colour in an asset is invisible to a reader and drifts away
 *      from the palette the first time the palette changes.
 *   2. The measurement uses the WCAG 2.1 formulas exactly, including the
 *      0.05 flare term and the sRGB linearisation threshold of 0.03928, so a
 *      contrast ratio computed here equals the ratio an audit tool reports.
 *
 * The checker scripts carry their own copy of this arithmetic on purpose:
 * scripts/checks/color-contrast.mjs is standalone by design, so a check cannot
 * inherit a bug from the code it verifies.
 */

/** Colour as three integer channels, each 0 to 255. */
export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** An HSL channel triple exactly as it appears in the token module. */
export interface HslTriple {
  /** Hue in degrees, 0 to 360. */
  readonly h: number;
  /** Saturation as a percentage, 0 to 100. */
  readonly s: number;
  /** Lightness as a percentage, 0 to 100. */
  readonly l: number;
}

const HSL_PATTERN = /^(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/;

/**
 * Parse an HSL channel triple such as `221.2 83.2% 53.3%`.
 *
 * The token module is the only intended caller, so a malformed value is a
 * programming error rather than user input: it throws instead of returning a
 * fallback colour, because a silently wrong brand colour is worse than a
 * failed build.
 */
export function parseHslTriple(triple: string): HslTriple {
  const match = HSL_PATTERN.exec(triple.trim());
  if (match === null) {
    throw new RangeError(`Colour triple is not in HSL channel form: ${triple}`);
  }
  const [, hue, saturation, lightness] = match;
  const h = Number(hue);
  const s = Number(saturation);
  const l = Number(lightness);
  if (s < 0 || s > 100 || l < 0 || l > 100) {
    throw new RangeError(`Colour triple has a channel out of range: ${triple}`);
  }
  return { h: ((h % 360) + 360) % 360, s, l };
}

/** HSL to RGB. Standard CSS Color 3 conversion, no rounding. */
export function hslToRgb({ h, s, l }: HslTriple): Rgb {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const sector = h / 60;
  const secondary = chroma * (1 - Math.abs((sector % 2) - 1));
  const base = lightness - chroma / 2;

  let channels: [number, number, number];
  if (sector < 1) {
    channels = [chroma, secondary, 0];
  } else if (sector < 2) {
    channels = [secondary, chroma, 0];
  } else if (sector < 3) {
    channels = [0, chroma, secondary];
  } else if (sector < 4) {
    channels = [0, secondary, chroma];
  } else if (sector < 5) {
    channels = [secondary, 0, chroma];
  } else {
    channels = [chroma, 0, secondary];
  }

  return {
    r: Math.round((channels[0] + base) * 255),
    g: Math.round((channels[1] + base) * 255),
    b: Math.round((channels[2] + base) * 255),
  };
}

/** Format a channel as two lower case hex digits. */
function channelToHex(value: number): string {
  return Math.min(255, Math.max(0, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

/** RGB to `#rrggbb`, lower case. */
export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

/** One step: an HSL channel triple from the token module to `#rrggbb`. */
export function hslTripleToHex(triple: string): string {
  return rgbToHex(hslToRgb(parseHslTriple(triple)));
}

/** True when the text is a colour triple this module can convert. */
export function isHslTriple(value: string): boolean {
  return HSL_PATTERN.test(value.trim());
}

/** One channel linearised for WCAG relative luminance. */
function linearise(channel: number): number {
  const scaled = channel / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance of a colour. */
export function relativeLuminance(color: Rgb): number {
  return 0.2126 * linearise(color.r) + 0.7152 * linearise(color.g) + 0.0722 * linearise(color.b);
}

/**
 * WCAG 2.1 contrast ratio between two colours, from 1 to 21.
 * The result is rounded to two decimals, which is the form a report quotes.
 */
export function contrastRatio(first: Rgb, second: Rgb): number {
  const lighter = relativeLuminance(first);
  const darker = relativeLuminance(second);
  const ratio =
    lighter >= darker ? (lighter + 0.05) / (darker + 0.05) : (darker + 0.05) / (lighter + 0.05);
  return Math.round(ratio * 100) / 100;
}

/** Convenience: the contrast ratio of two HSL channel triples. */
export function contrastRatioOfTriples(first: string, second: string): number {
  return contrastRatio(hslToRgb(parseHslTriple(first)), hslToRgb(parseHslTriple(second)));
}

/**
 * The triple with one channel replaced, used to derive a border or a shadow
 * from a role without introducing a second source of truth for its hue.
 */
export function withLightness(triple: string, lightness: number): string {
  const { h, s } = parseHslTriple(triple);
  return `${String(h)} ${String(s)}% ${String(lightness)}%`;
}
