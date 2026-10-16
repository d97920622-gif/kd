// path: lib/seo/og-image.ts
/**
 * The default social image: what a link to this platform looks like when it is
 * shared, before any page has been written.
 *
 * A link preview is the first impression of a product and the only piece of it
 * a recipient sees before deciding whether to click. Left to the platform
 * default it is either a cropped screenshot or a grey rectangle, which is why
 * this image is built rather than uploaded: it is composed from the same brand
 * geometry and the same colour tokens as everything else, so a palette change
 * reaches it, and it stays correct at every size a platform asks for without
 * anyone re-exporting artwork.
 *
 * Why it is not a file in this sub-step. Next attaches metadata to a route
 * segment, so the image belongs to the routes that serve it, and there is no
 * public route yet: the only page in the build is the development gallery,
 * which must leave no trace in a production response. The renderer therefore
 * ships complete and verified here, and the route that mounts it lands with
 * the public site. Nothing about the image is deferred except its URL.
 *
 * Why `next/og` and not a canvas library. It draws the monogram as an embedded
 * SVG, which is the same drawing scripts/brand/render.ts rasterises for the
 * icon files and components/branding/logo-mark.tsx strokes in the browser: one
 * geometry, three renderers, and no binary asset to keep in step. The font is
 * the one Next already bundles, so nothing is downloaded at build time.
 *
 * This module is deliberately free of JSX: the file is `.ts` in the project
 * plan, and building elements with `createElement` keeps it usable from a
 * script with no compiler for component syntax.
 */
import { ImageResponse } from 'next/og';
import { createElement, type ReactElement } from 'react';

import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/config/brand';
import { COLOR_THEME_VALUES } from '@/config/design-tokens.ts';
import { brandPlateElement, brandPathElement } from '@/lib/brand/mark';
import { brand } from '@/lib/i18n/strings/en/brand';
import { hslTripleToHex } from '@/lib/utils/color';

/**
 * Social image dimensions and type, as the networks expect them.
 *
 * 1200 by 630 is the size the major platforms crop to. A larger image is
 * downscaled and a smaller one is stretched, and both look like an accident.
 */
export const OG_IMAGE_SIZE = { width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT } as const;
export const OG_IMAGE_CONTENT_TYPE = 'image/png';
export const OG_IMAGE_PATH = '/opengraph-image';

/** The theme the social image is drawn in, and the roles it paints from. */
const OG_THEME = 'light';
const OG_ROLES = [
  'background',
  'foreground',
  'muted-foreground',
  'primary',
  'primary-foreground',
] as const;

type OgRole = (typeof OG_ROLES)[number];

/**
 * Resolve every role the image needs, in one place.
 *
 * A missing role is a programming error rather than a runtime condition: the
 * token module declares all four themes with full parity, and a social image
 * that silently falls back to transparent would ship a black rectangle to
 * every network at once.
 */
function ogPalette(): Record<OgRole, string> {
  const theme = COLOR_THEME_VALUES[OG_THEME];
  const palette = {} as Record<OgRole, string>;
  for (const role of OG_ROLES) {
    const triple = theme[role];
    if (triple === undefined) {
      throw new Error(`the brand palette has no ${role} role in the ${OG_THEME} theme`);
    }
    palette[role] = hslTripleToHex(triple);
  }
  return palette;
}

/**
 * The monogram, as a data URI the image renderer can embed.
 *
 * `next/og` composes an image from layout primitives and rasterises an
 * embedded SVG through resvg. Handing it the mark as SVG keeps the social
 * image faithful to the drawn logo instead of to a redrawn approximation of
 * it, which is the failure mode this whole sub-step exists to avoid.
 */
export function markDataUri(options: { readonly size: number }): string {
  const palette = ogPalette();
  const plate = brandPlateElement({ fillsSquare: false, fill: palette.primary });
  const glyph = brandPathElement({ fill: palette['primary-foreground'] });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${String(options.size)}" height="${String(options.size)}">${plate}${glyph}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}

/**
 * Build the default social image.
 *
 * The composition is the light theme's canvas and body text, the plate icon at
 * the left, and the product name with its description beside it: the same
 * three ingredients a person sees in the application header, at the size a
 * link preview is read at. The alt text that goes with it is a brand string,
 * so the description a network shows and the description the page shows cannot
 * drift apart.
 */
export function buildDefaultOgImage(): ImageResponse {
  const palette = ogPalette();
  const markSize = 240;

  const element: ReactElement = createElement(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 72,
        padding: 96,
        backgroundColor: palette.background,
        color: palette.foreground,
      },
    },
    createElement('img', {
      src: markDataUri({ size: markSize }),
      width: markSize,
      height: markSize,
      alt: '',
    }),
    createElement(
      'div',
      { style: { display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 700 } },
      createElement(
        'div',
        { style: { fontSize: 84, fontWeight: 700, lineHeight: 1.1 } },
        brand.name,
      ),
      createElement(
        'div',
        { style: { fontSize: 40, lineHeight: 1.3, color: palette['muted-foreground'] } },
        brand.description,
      ),
    ),
  );

  return new ImageResponse(element, { ...OG_IMAGE_SIZE });
}

/**
 * Render the default social image to bytes.
 *
 * The seam the brand check uses. It renders the image exactly as a route would
 * and hands back the PNG, so its dimensions, its type and the fact that the
 * drawing actually appeared can all be asserted without an HTTP server.
 */
export async function renderDefaultOgImage(): Promise<Uint8Array> {
  return new Uint8Array(await buildDefaultOgImage().arrayBuffer());
}
