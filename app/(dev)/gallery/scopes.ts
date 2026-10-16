// path: app/(dev)/gallery/scopes.ts
import { THEME_SCOPE_TOKENS, type ThemeScopeTheme } from '@/config/design-tokens.ts';
import { type EnglishStringKey } from '@/lib/i18n';

/**
 * The themes the gallery renders, and the heading each one is given.
 *
 * The list itself is not declared here. It comes from THEME_SCOPE_TOKENS in
 * config/design-tokens.ts, which is the single owner of the scope class names:
 * the stylesheet declares one rule per class, the Tailwind safelist is built
 * from the same list, and scripts/checks/design-tokens.mjs compares the list
 * with the stylesheet in both directions. Duplicating the names here is how a
 * scope ends up styled in one file and unknown in another.
 *
 * What belongs to the page, and stays here, is the heading. The mapping is
 * total: `ThemeScopeTheme` is a union of the theme names in the token list, so
 * a new scope fails the type check until it has a label instead of rendering
 * an empty heading.
 *
 * The reduced motion scope is not a palette but a motion scope: it pins the
 * zeroed durations onto one block of the page while the rest of the page keeps
 * its motion, so a reviewer sees both at once.
 */
export interface GalleryScope {
  /** Identifier used for headings and anchors, drawn from the theme name. */
  readonly id: string;
  /** Class that pins the theme, declared in styles/globals.css. */
  readonly className: string;
  /** Catalogue key of the heading. */
  readonly labelKey: EnglishStringKey;
  /** True when the scope pins motion rather than a palette. */
  readonly motionOnly: boolean;
}

const SCOPE_LABEL_KEYS: Readonly<Record<ThemeScopeTheme, EnglishStringKey>> = {
  light: 'gallery.label_scope_light',
  dark: 'gallery.label_scope_dark',
  'high-contrast-light': 'gallery.label_scope_hc_light',
  'high-contrast-dark': 'gallery.label_scope_hc_dark',
  'reduced-motion': 'gallery.label_scope_reduced_motion',
};

export const GALLERY_SCOPES: readonly GalleryScope[] = THEME_SCOPE_TOKENS.map((scope) => ({
  id: scope.theme,
  className: scope.className,
  labelKey: SCOPE_LABEL_KEYS[scope.theme],
  motionOnly: scope.motionOnly,
}));

/** The scopes that pin a palette, used where only a palette makes sense. */
export const PALETTE_SCOPES: readonly GalleryScope[] = GALLERY_SCOPES.filter(
  (scope) => !scope.motionOnly,
);
