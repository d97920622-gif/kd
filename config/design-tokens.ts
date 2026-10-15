// path: config/design-tokens.ts
/**
 * Design tokens: spacing, radius, shadow and z-index.
 *
 * This file is the single source of truth for every value that reaches CSS
 * through Tailwind (config/design-tokens.ts is owned by step 1, see
 * docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md). tailwind.config.ts imports these
 * scales instead of declaring literals, styles/globals.css defines the CSS
 * variables the shadow and z-index tokens reference, and
 * scripts/checks/design-tokens.mjs verifies in both directions that the two
 * files stay in step and that application code uses tokens rather than raw
 * values.
 *
 * Rules that apply to every consumer:
 *   1. A component uses token classes (p-4, gap-2, rounded-lg, shadow-md,
 *      z-modal). Arbitrary values such as p-[13px] are rejected by the check.
 *   2. A new value is never invented in a component. If a scale needs a new
 *      step, it is added here with a documented reason.
 *   3. Color never appears in this file: the palette is sub-step 1.14.
 */

/** Base spacing unit. Every layout step is a whole multiple of it. */
export const SPACING_UNIT_PX = 4;

/** A spacing token: the CSS value and the reason it exists. */
export interface SpacingToken {
  readonly value: string;
  readonly usage: string;
}

/**
 * The layout spacing scale mandated by the specification:
 * 4, 8, 12, 16, 24, 32, 48 and 64 pixels. These eight values carry the
 * numeric Tailwind aliases (1, 2, 3, 4, 6, 8, 12, 16) so that p-4 means
 * 16px, as in the default Tailwind convention.
 */
export const SPACING_SCALE_TOKENS: Record<string, SpacingToken> = {
  '1': { value: '4px', usage: 'tightest inline gap, icon to label' },
  '2': { value: '8px', usage: 'inline gap, compact padding inside controls' },
  '3': { value: '12px', usage: 'form control padding, list row gaps' },
  '4': { value: '16px', usage: 'default padding and gap between related blocks' },
  '6': { value: '24px', usage: 'padding inside cards, gap between groups' },
  '8': { value: '32px', usage: 'section spacing, page padding on desktop' },
  '12': { value: '48px', usage: 'large section spacing' },
  '16': { value: '64px', usage: 'page section separation on wide screens' },
};

/** The mandated layout spacing values in pixels, used by the token check. */
export const REQUIRED_SPACING_PX: readonly number[] = [4, 8, 12, 16, 24, 32, 48, 64];

/**
 * Supporting spacing tokens. These are not layout rhythm: they size
 * controls, icon boxes and hairlines, where the eight value scale is too
 * coarse. Every entry carries its reason, and nothing else may be added
 * without the same justification.
 */
export const SPACING_SUPPORT_TOKENS: Record<string, SpacingToken> = {
  '0': { value: '0px', usage: 'reset padding or margin explicitly' },
  px: { value: '1px', usage: 'hairline width for borders and dividers' },
  '0.5': { value: '2px', usage: 'hairline offset inside a control' },
  '1.5': { value: '6px', usage: 'compact control padding below the 8px step' },
  '2.5': { value: '10px', usage: 'compact control padding between 8px and 12px' },
  '3.5': { value: '14px', usage: 'compact control padding below the 16px step' },
  '5': { value: '20px', usage: 'icon box and avatar size above the 16px step' },
  '9': { value: '36px', usage: 'small control height, dense tables and toolbars' },
  '10': { value: '40px', usage: 'default control height for inputs and buttons' },
  '11': { value: '44px', usage: 'large control height, meets the 44px touch target' },
  gutter: { value: '16px', usage: 'page and card gutter, named for intent' },
  section: { value: '32px', usage: 'vertical rhythm between page sections' },
  touch: { value: '44px', usage: 'minimum touch target for mobile, WCAG and iOS guidance' },
};

/** Every spacing key available to Tailwind, scale and support together. */
export const SPACING_TOKENS: Record<string, string> = {
  ...mapValues(SPACING_SCALE_TOKENS),
  ...mapValues(SPACING_SUPPORT_TOKENS),
};

/** Reduce a token group to its Tailwind value map. */
function mapValues(tokens: Record<string, { readonly value: string }>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, token] of Object.entries(tokens)) {
    result[key] = token.value;
  }
  return result;
}

/** A radius token: the CSS value and the reason it exists. */
export interface RadiusToken {
  readonly value: string;
  readonly usage: string;
}

/**
 * Radius scale: none, sm, md, lg, xl, full. Everything above sm derives from
 * the --radius variable in styles/globals.css, so a tenant or a future theme
 * can change the base radius in one place and every component follows.
 */
export const RADIUS_TOKENS: Record<string, RadiusToken> = {
  none: { value: '0px', usage: 'sharp corners: table cells, nested panels' },
  sm: { value: 'calc(var(--radius) - 4px)', usage: 'small controls, badges, tags' },
  md: { value: 'calc(var(--radius) - 2px)', usage: 'inputs, buttons, menu items' },
  lg: { value: 'var(--radius)', usage: 'default surface radius: cards, panels' },
  xl: { value: 'calc(var(--radius) + 4px)', usage: 'large surfaces: modals, sheets' },
  full: { value: '9999px', usage: 'pills, avatars, circular icon buttons' },
};

/** Radius map for Tailwind: key to CSS value, straight from RADIUS_TOKENS. */
export const RADIUS_CLASS_MAP: Record<string, string> = mapValues(RADIUS_TOKENS);

/** Radius keys the specification requires, used by the token check. */
export const REQUIRED_RADIUS_KEYS: readonly string[] = ['none', 'sm', 'md', 'lg', 'xl', 'full'];

/** A shadow token: the CSS variable it resolves to and its usage. */
export interface ShadowToken {
  readonly value: string;
  readonly usage: string;
}

/**
 * Shadow scale: sm, md, lg, xl, 2xl. Each value is a CSS variable so dark
 * mode can strengthen the same shadow without changing a component class.
 */
export const SHADOW_TOKENS: Record<string, ShadowToken> = {
  sm: { value: 'var(--shadow-sm)', usage: 'subtle lift: inputs, buttons on hover' },
  md: { value: 'var(--shadow-md)', usage: 'raised content: cards, dropdowns' },
  lg: { value: 'var(--shadow-lg)', usage: 'overlays: popovers, sticky bars' },
  xl: { value: 'var(--shadow-xl)', usage: 'dialogs and sheets' },
  '2xl': { value: 'var(--shadow-2xl)', usage: 'full screen overlays and toasts' },
};

/** Shadow map for Tailwind: key to CSS variable, straight from SHADOW_TOKENS. */
export const SHADOW_CLASS_MAP: Record<string, string> = mapValues(SHADOW_TOKENS);

/** Shadow keys the specification requires, used by the token check. */
export const REQUIRED_SHADOW_KEYS: readonly string[] = ['sm', 'md', 'lg', 'xl', '2xl'];

/** A z-index layer: the numeric value, the CSS variable and the reason. */
export interface ZIndexToken {
  readonly value: number;
  readonly variable: string;
  readonly usage: string;
}

/**
 * Z-index ladder. Every stacking requirement in the product maps to exactly
 * one layer. The order below is the contract:
 *
 *   content < docked < sticky < sidebar < skip link < overlay < modal
 *   < dropdown < popover < tooltip < toast
 *
 * Rules:
 *   - Never write a numeric z-index outside this file.
 *   - A dropdown sits above a modal because selects and menus are opened
 *     inside dialogs; a tooltip sits above a dropdown for the same reason.
 *   - A toast sits above everything except nothing: a toast must be readable
 *     while a dialog is open.
 *   - The skip link sits above the header and sidebar but below the overlay,
 *     so it is never reachable-looking while a modal owns the focus.
 */
export const Z_INDEX_TOKENS: Record<string, ZIndexToken> = {
  hide: {
    value: -1,
    variable: '--z-hide',
    usage: 'visually hidden helpers that must stay behind content',
  },
  base: { value: 0, variable: '--z-base', usage: 'normal document flow' },
  raised: {
    value: 10,
    variable: '--z-raised',
    usage: 'raised content inside a scroll container, for example a pinned row',
  },
  docked: {
    value: 20,
    variable: '--z-docked',
    usage: 'sticky bottom action bar, sticky table header, mobile bottom navigation',
  },
  sticky: { value: 30, variable: '--z-sticky', usage: 'sticky topbar and page header' },
  sidebar: { value: 40, variable: '--z-sidebar', usage: 'desktop sidebar and mobile drawer panel' },
  'skip-link': {
    value: 45,
    variable: '--z-skip-link',
    usage: 'skip to content link when focused, above header and sidebar',
  },
  overlay: { value: 50, variable: '--z-overlay', usage: 'modal, sheet and drawer backdrop' },
  modal: { value: 60, variable: '--z-modal', usage: 'dialog, sheet and drawer content' },
  dropdown: {
    value: 70,
    variable: '--z-dropdown',
    usage: 'select, menu and command palette content opened inside a dialog',
  },
  popover: { value: 80, variable: '--z-popover', usage: 'popover content above a dropdown' },
  tooltip: { value: 90, variable: '--z-tooltip', usage: 'tooltip content above every panel' },
  toast: {
    value: 100,
    variable: '--z-toast',
    usage: 'toast and notification stack, always visible',
  },
};

/** Layers the specification requires, used by the token check. */
export const REQUIRED_Z_LAYERS: readonly string[] = [
  'base',
  'sticky',
  'overlay',
  'modal',
  'dropdown',
  'popover',
  'tooltip',
  'toast',
];

/** Tailwind zIndex map: 'skip-link' becomes z-skip-link. */
export const Z_INDEX_CLASS_MAP: Record<string, string> = mapZValues();

function mapZValues(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, token] of Object.entries(Z_INDEX_TOKENS)) {
    result[key] = String(token.value);
  }
  return result;
}

/**
 * Z-index and shadow variable names that styles/globals.css must declare.
 * scripts/checks/design-tokens.mjs verifies both directions: every name here
 * exists in the stylesheet with the same value, and the stylesheet declares
 * no --z-* variable that is absent here.
 */
export const REQUIRED_CSS_VARIABLES: Record<string, string> = {
  ...zIndexVariables(),
  ...shadowVariables(),
};

function zIndexVariables(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of Object.values(Z_INDEX_TOKENS)) {
    result[token.variable] = String(token.value);
  }
  return result;
}

function shadowVariables(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of Object.values(SHADOW_TOKENS)) {
    const match = /^var\((--[a-z0-9-]+)\)$/.exec(token.value);
    if (match !== null) {
      result[match[1]] = 'defined';
    }
  }
  return result;
}

/** Every token group with its required keys, for the token check report. */
export const TOKEN_GROUPS: readonly {
  readonly name: string;
  readonly keyCount: number;
  readonly requiredKeys: readonly string[];
}[] = [
  {
    name: 'spacing',
    keyCount: Object.keys(SPACING_TOKENS).length,
    requiredKeys: REQUIRED_SPACING_PX.map((value) => `${value}px`),
  },
  {
    name: 'radius',
    keyCount: Object.keys(RADIUS_TOKENS).length,
    requiredKeys: REQUIRED_RADIUS_KEYS,
  },
  {
    name: 'shadow',
    keyCount: Object.keys(SHADOW_TOKENS).length,
    requiredKeys: REQUIRED_SHADOW_KEYS,
  },
  {
    name: 'z-index',
    keyCount: Object.keys(Z_INDEX_TOKENS).length,
    requiredKeys: REQUIRED_Z_LAYERS,
  },
];
