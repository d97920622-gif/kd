// path: app/(dev)/gallery/scopes.ts
import { type EnglishStringKey } from '@/lib/i18n';

/**
 * The themes the gallery renders, in the order they appear on the page.
 *
 * The first four are the palettes: light, dark, and the high contrast pair the
 * operating system preference switches to. The fifth is not a palette but a
 * motion scope: it pins the reduced motion durations onto a block of the page
 * while the rest of the page keeps its motion, so a reviewer can see both at
 * once and confirm that nothing is animated for a user who asked for no
 * motion.
 *
 * The class names must match the blocks in styles/globals.css exactly; the
 * contrast checker compares every one of those blocks with
 * config/design-tokens.ts token by token, so a scope cannot silently drift
 * from the theme it mirrors.
 */
export interface GalleryScope {
  /** Identifier used for headings and anchors (ASCII, stable). */
  readonly id: string;
  /** Class that pins the theme, as declared in styles/globals.css. */
  readonly className: string;
  /** Catalogue key of the heading. */
  readonly labelKey: EnglishStringKey;
  /** True when the scope pins motion rather than a palette. */
  readonly motionOnly: boolean;
}

export const GALLERY_SCOPES: readonly GalleryScope[] = [
  {
    id: 'scope-light',
    className: 'theme-light',
    labelKey: 'gallery.label_scope_light',
    motionOnly: false,
  },
  {
    id: 'scope-dark',
    className: 'theme-dark',
    labelKey: 'gallery.label_scope_dark',
    motionOnly: false,
  },
  {
    id: 'scope-hc-light',
    className: 'theme-hc-light',
    labelKey: 'gallery.label_scope_hc_light',
    motionOnly: false,
  },
  {
    id: 'scope-hc-dark',
    className: 'theme-hc-dark',
    labelKey: 'gallery.label_scope_hc_dark',
    motionOnly: false,
  },
  {
    id: 'scope-reduced-motion',
    className: 'theme-reduced-motion',
    labelKey: 'gallery.label_scope_reduced_motion',
    motionOnly: true,
  },
];

/** The scopes that pin a palette, used for the palette swatch row. */
export const PALETTE_SCOPES: readonly GalleryScope[] = GALLERY_SCOPES.filter(
  (scope) => !scope.motionOnly,
);
