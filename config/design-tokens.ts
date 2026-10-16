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
 *   3. A surface that needs one specific width uses a LAYOUT_WIDTH_TOKENS
 *      entry (menu, popover, tooltip, dialog, sheet). An off-scale width
 *      step, such as w-72, does not exist in this project because the width
 *      utilities come from the spacing scale.
 *   4. Color lives here too: COLOR_THEME_VALUES holds the four themes
 *      (light, dark, high-contrast light, high-contrast dark) and
 *      CONTRAST_PAIRS is the WCAG contract every theme must satisfy.
 *   5. styles/globals.css declares the variables and nothing else; the values
 *      there must equal the values here. scripts/checks/design-tokens.mjs and
 *      scripts/checks/color-contrast.mjs enforce both directions, so a raw
 *      hex value or a drifting CSS block fails npm run verify.
 *   6. config/design-tokens.json is generated from this file by
 *      npm run tokens:export for design tooling; verify fails when it is
 *      stale. Never edit the JSON by hand.
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

/** A layout width token: the CSS value and the reason it exists. */
export interface LayoutWidthToken {
  readonly value: string;
  readonly usage: string;
}

/**
 * Layout widths for surfaces that must not size themselves from their
 * content.
 *
 * These exist because width utilities in this project come from the spacing
 * scale, and the spacing scale deliberately has no 288px or 320px step: a
 * panel that needs one specific width gets a named token here instead of a
 * raw value or an off-scale step. Every entry is a maximum or a minimum
 * unless the surface is a floating panel, which has no content to measure
 * before it is shown.
 */
export const LAYOUT_WIDTH_TOKENS: Record<string, LayoutWidthToken> = {
  menu: {
    value: '10rem',
    usage: 'minimum width of a dropdown menu, so two short items are not cramped',
  },
  popover: {
    value: '20rem',
    usage: 'a floating popover: a date picker or a filter panel with controls inside',
  },
  tooltip: {
    value: '16rem',
    usage: 'maximum tooltip width before the hint wraps to a second line',
  },
  dialog: {
    value: '32rem',
    usage: 'maximum dialog panel width, a form or a confirmation at a readable measure',
  },
  sheet: {
    value: '24rem',
    usage: 'maximum width of an edge panel, wide enough for a field and its label',
  },
};

/** Keys the layout width scale must contain, used by the token check. */
export const REQUIRED_LAYOUT_WIDTH_KEYS: readonly string[] = [
  'menu',
  'popover',
  'tooltip',
  'dialog',
  'sheet',
];

/** Tailwind width map: floating panels that need a fixed width. */
export const WIDTH_CLASS_MAP: Record<string, string> = mapLayoutWidths(['popover']);

/** Tailwind minWidth map: surfaces that need a floor but may grow. */
export const MIN_WIDTH_CLASS_MAP: Record<string, string> = mapLayoutWidths(['menu']);

/** Tailwind maxWidth map: surfaces that need a ceiling on a wide screen. */
export const MAX_WIDTH_CLASS_MAP: Record<string, string> = mapLayoutWidths([
  'tooltip',
  'dialog',
  'sheet',
]);

function mapLayoutWidths(keys: readonly string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const token = LAYOUT_WIDTH_TOKENS[key];
    if (token !== undefined) {
      result[key] = token.value;
    }
  }
  return result;
}

/** A font size token: size, line height, tracking and the reason it exists. */
export interface FontSizeToken {
  readonly size: string;
  readonly lineHeight: string;
  readonly letterSpacing: string;
  readonly usage: string;
}

/**
 * Typography scale. The body step is 16px and is the floor for every text
 * size that carries reading content: a control smaller than 16px makes iOS
 * Safari zoom the viewport on focus, and 16px is the smallest size that meets
 * the platform accessibility guidance for body copy at 320px width.
 *
 * Display steps (xl and above) are headings and marketing copy only. Line
 * heights are absolute pixel values: a line height in an em ratio drifts with
 * the font stack and breaks the vertical rhythm the spacing scale defines.
 */
export const FONT_SIZE_TOKENS: Record<string, FontSizeToken> = {
  xs: {
    size: '12px',
    lineHeight: '16px',
    letterSpacing: '0.02em',
    usage: 'captions, badge counts, legal footnotes, timestamp metadata',
  },
  sm: {
    size: '14px',
    lineHeight: '20px',
    letterSpacing: '0.01em',
    usage: 'table cells, helper text, secondary metadata, compact controls',
  },
  base: {
    size: '16px',
    lineHeight: '24px',
    letterSpacing: '0',
    usage: 'body copy, form controls and every reading text; the platform minimum',
  },
  lg: {
    size: '18px',
    lineHeight: '28px',
    letterSpacing: '0',
    usage: 'lead paragraphs, card titles, dialog titles',
  },
  xl: {
    size: '20px',
    lineHeight: '28px',
    letterSpacing: '-0.005em',
    usage: 'section titles inside a page',
  },
  '2xl': {
    size: '24px',
    lineHeight: '32px',
    letterSpacing: '-0.01em',
    usage: 'page titles, dashboard metric values',
  },
  '3xl': {
    size: '30px',
    lineHeight: '36px',
    letterSpacing: '-0.015em',
    usage: 'marketing section headings',
  },
  '4xl': {
    size: '36px',
    lineHeight: '40px',
    letterSpacing: '-0.02em',
    usage: 'public site hero heading on desktop',
  },
  '5xl': {
    size: '48px',
    lineHeight: '56px',
    letterSpacing: '-0.02em',
    usage: 'public site hero heading on wide screens, one per page',
  },
};

/** Font sizes the specification requires, used by the token check. */
export const REQUIRED_FONT_SIZE_KEYS: readonly string[] = [
  'xs',
  'sm',
  'base',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
];

/**
 * The smallest size that may carry reading content or sit inside a form
 * control. scripts/checks/design-tokens.mjs fails when the body step drops
 * below it, because iOS Safari would zoom the whole page on focus.
 */
export const MINIMUM_BODY_TEXT_PX = 16;

/** Font weights in use. Four steps cover every hierarchy the product needs. */
export const FONT_WEIGHT_TOKENS: Record<string, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Font families. next/font injects --font-sans and --font-mono on the html
 * element in the layout shells; styles/globals.css declares the same
 * variables as a fallback so a page rendered without the layout still gets
 * the platform stack. No self-hosted file is referenced here, so a font
 * failure degrades to the system stack instead of to invisible text.
 */
export const FONT_FAMILY_TOKENS: Record<string, readonly string[]> = {
  sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
};

/** Tailwind fontSize map: [size, { lineHeight, letterSpacing }]. */
export const FONT_SIZE_CLASS_MAP: Record<
  string,
  [string, { lineHeight: string; letterSpacing: string }]
> = mapFontSizes();

function mapFontSizes(): Record<string, [string, { lineHeight: string; letterSpacing: string }]> {
  const result: Record<string, [string, { lineHeight: string; letterSpacing: string }]> = {};
  for (const [key, token] of Object.entries(FONT_SIZE_TOKENS)) {
    result[key] = [
      token.size,
      { lineHeight: token.lineHeight, letterSpacing: token.letterSpacing },
    ];
  }
  return result;
}

/** Tailwind fontFamily map, straight from FONT_FAMILY_TOKENS. */
export const FONT_FAMILY_CLASS_MAP: Record<string, string[]> = mapFontFamilies();

function mapFontFamilies(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const [key, stack] of Object.entries(FONT_FAMILY_TOKENS)) {
    result[key] = [...stack];
  }
  return result;
}

/** Tailwind fontWeight map: the numeric weights as CSS strings. */
export const FONT_WEIGHT_CLASS_MAP: Record<string, string> = mapFontWeights();

function mapFontWeights(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, weight] of Object.entries(FONT_WEIGHT_TOKENS)) {
    result[key] = String(weight);
  }
  return result;
}

/** A motion duration: the value, its reduced-motion value and the variable. */
export interface MotionDurationToken {
  readonly value: string;
  readonly reducedValue: string;
  readonly variable: string;
  readonly usage: string;
}

/**
 * Motion durations. The reduced motion value is what styles/globals.css
 * applies inside @media (prefers-reduced-motion: reduce): the same interface
 * with animation removed, never a different interface. Framer Motion reads
 * the same intent through useReducedMotion in sub-step 1.25.
 */
export const MOTION_DURATION_TOKENS: Record<string, MotionDurationToken> = {
  instant: {
    value: '0ms',
    reducedValue: '0ms',
    variable: '--duration-instant',
    usage: 'state changes that must never animate: theme switch, table sort, tab underline',
  },
  fast: {
    value: '120ms',
    reducedValue: '0ms',
    variable: '--duration-fast',
    usage: 'hover, focus ring, checkbox and switch toggles, small state changes',
  },
  base: {
    value: '200ms',
    reducedValue: '0ms',
    variable: '--duration-base',
    usage: 'default for dropdowns, tooltips, toasts and inline reveals',
  },
  slow: {
    value: '320ms',
    reducedValue: '0ms',
    variable: '--duration-slow',
    usage: 'dialogs, sheets, drawers, mobile navigation and page transitions',
  },
  slower: {
    value: '500ms',
    reducedValue: '0ms',
    variable: '--duration-slower',
    usage: 'progress reveals and marketing motion, never for interactive feedback',
  },
};

/** Duration keys the specification requires, used by the token check. */
export const REQUIRED_MOTION_DURATION_KEYS: readonly string[] = ['fast', 'base', 'slow'];

/** An easing curve: the CSS value, the variable and the reason. */
export interface EasingToken {
  readonly value: string;
  readonly variable: string;
  readonly usage: string;
}

/**
 * Easing curves. Standard is the default for two-way motion, enter and exit
 * are asymmetric so an element leaves faster than it arrives, and linear is
 * reserved for continuous progress where an ease curve would look uneven.
 */
export const MOTION_EASING_TOKENS: Record<string, EasingToken> = {
  standard: {
    value: 'cubic-bezier(0.2, 0, 0, 1)',
    variable: '--ease-standard',
    usage: 'default for every two-way transition: hover, expand, resize',
  },
  enter: {
    value: 'cubic-bezier(0, 0, 0.2, 1)',
    variable: '--ease-enter',
    usage: 'elements appearing: dialog, dropdown, toast',
  },
  exit: {
    value: 'cubic-bezier(0.4, 0, 1, 1)',
    variable: '--ease-exit',
    usage: 'elements leaving: close, dismiss, collapse',
  },
  linear: {
    value: 'linear',
    variable: '--ease-linear',
    usage: 'continuous progress: upload bar, skeleton shimmer, spinner',
  },
};

/** Easing keys the specification requires, used by the token check. */
export const REQUIRED_EASING_KEYS: readonly string[] = ['standard', 'enter', 'exit'];

/** Tailwind transitionDuration map, straight from the durations. */
export const DURATION_CLASS_MAP: Record<string, string> = mapDurations();

function mapDurations(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, token] of Object.entries(MOTION_DURATION_TOKENS)) {
    result[key] = token.value;
  }
  return result;
}

/** Tailwind transitionTimingFunction map, straight from the easings. */
export const EASING_CLASS_MAP: Record<string, string> = mapEasings();

function mapEasings(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, token] of Object.entries(MOTION_EASING_TOKENS)) {
    result[key] = token.value;
  }
  return result;
}

/** The four themes every semantic color role must satisfy. */
export const COLOR_THEME_NAMES = [
  'light',
  'dark',
  'high-contrast-light',
  'high-contrast-dark',
] as const;

/** A theme name: light, dark, or their high contrast counterparts. */
export type ColorThemeName = (typeof COLOR_THEME_NAMES)[number];

/** What a color role is used for, which decides its contrast minimum. */
export type ColorRoleKind = 'surface' | 'text' | 'boundary' | 'focus';

/** A semantic color role: its kind and the reason it exists. */
export interface ColorRoleToken {
  readonly kind: ColorRoleKind;
  readonly usage: string;
}

/**
 * Semantic color roles. These names, and only these names, become CSS
 * variables in styles/globals.css (role "card-foreground" becomes
 * --card-foreground), which is where tailwind.config.ts reads them from.
 *
 * A component never references a palette step such as blue-600. It uses a
 * role class (bg-primary, text-muted-foreground, border-input), so dark mode
 * and high contrast stay complete without touching a component.
 */
export const COLOR_ROLES: Record<string, ColorRoleToken> = {
  background: { kind: 'surface', usage: 'the page canvas behind every surface' },
  foreground: { kind: 'text', usage: 'body and heading text on the page canvas' },
  card: { kind: 'surface', usage: 'card, panel and table surface' },
  'card-foreground': { kind: 'text', usage: 'text on a card surface' },
  popover: { kind: 'surface', usage: 'popover, dropdown and dialog surface' },
  'popover-foreground': { kind: 'text', usage: 'text on a popover surface' },
  primary: { kind: 'surface', usage: 'brand action: primary button, active navigation, link text' },
  'primary-foreground': { kind: 'text', usage: 'text and icons on a primary surface' },
  secondary: { kind: 'surface', usage: 'secondary button and low emphasis surface' },
  'secondary-foreground': { kind: 'text', usage: 'text and icons on a secondary surface' },
  muted: { kind: 'surface', usage: 'muted surface: table header, code block, disabled field' },
  'muted-foreground': {
    kind: 'text',
    usage: 'secondary text: helper text, metadata, inactive icon',
  },
  accent: { kind: 'surface', usage: 'hover and selected surface for menu items and rows' },
  'accent-foreground': { kind: 'text', usage: 'text and icons on an accent surface' },
  destructive: { kind: 'surface', usage: 'danger action surface: delete, void, revoke' },
  'destructive-foreground': { kind: 'text', usage: 'text and icons on a danger surface' },
  success: { kind: 'surface', usage: 'positive state surface: paid, approved, reconciled' },
  'success-foreground': { kind: 'text', usage: 'text and icons on a positive surface' },
  warning: {
    kind: 'surface',
    usage: 'attention state surface: overdue, pending review, low balance',
  },
  'warning-foreground': { kind: 'text', usage: 'text and icons on an attention surface' },
  border: {
    kind: 'boundary',
    usage: 'decorative divider and card outline; it never carries information alone',
  },
  input: {
    kind: 'boundary',
    usage: 'form control outline, the visible boundary of an editable field',
  },
  ring: { kind: 'focus', usage: 'keyboard focus indicator, never removed' },
};

/**
 * The value of every role in every theme, as an HSL channel triple so
 * Tailwind opacity modifiers work (bg-primary/50) and dark mode can replace
 * a value without touching a component.
 *
 * Every theme declares every role: dark mode has full parity with light mode,
 * and the high contrast themes change values only. scripts/checks/color-contrast.mjs
 * fails when a theme is missing a role or when a value here differs from the
 * declaration in styles/globals.css.
 */
export const COLOR_THEME_VALUES: Record<ColorThemeName, Record<string, string>> = {
  light: {
    background: '0 0% 100%',
    foreground: '222.2 47.4% 11.2%',
    card: '0 0% 100%',
    'card-foreground': '222.2 47.4% 11.2%',
    popover: '0 0% 100%',
    'popover-foreground': '222.2 47.4% 11.2%',
    primary: '221.2 83.2% 53.3%',
    'primary-foreground': '210 40% 98%',
    secondary: '210 40% 96.1%',
    'secondary-foreground': '222.2 47.4% 11.2%',
    muted: '210 40% 96.1%',
    'muted-foreground': '215.4 16.3% 40%',
    accent: '210 40% 96.1%',
    'accent-foreground': '222.2 47.4% 11.2%',
    destructive: '0 72.2% 45.4%',
    'destructive-foreground': '210 40% 98%',
    success: '142.1 76.2% 28%',
    'success-foreground': '355.7 100% 97.3%',
    warning: '32.1 94.6% 43.7%',
    'warning-foreground': '0 0% 0%',
    border: '214.3 31.8% 91.4%',
    input: '215.4 16.3% 55%',
    ring: '221.2 83.2% 53.3%',
  },
  dark: {
    background: '222.2 84% 4.9%',
    foreground: '210 40% 98%',
    card: '222.2 84% 4.9%',
    'card-foreground': '210 40% 98%',
    popover: '222.2 84% 4.9%',
    'popover-foreground': '210 40% 98%',
    primary: '217.2 91.2% 59.8%',
    'primary-foreground': '222.2 47.4% 11.2%',
    secondary: '217.2 32.6% 17.5%',
    'secondary-foreground': '210 40% 98%',
    muted: '217.2 32.6% 17.5%',
    'muted-foreground': '215 20.2% 65.1%',
    accent: '217.2 32.6% 17.5%',
    'accent-foreground': '210 40% 98%',
    // A dark red cannot be both a danger surface under light text and danger
    // text on the near-black canvas: the two requirements pull in opposite
    // directions, and a mid red satisfies neither. The theme therefore uses
    // the tonal pattern: a vivid red surface with a dark label, which keeps
    // the delete button readable and the destructive link text at 4.5:1 or
    // better against the page canvas.
    destructive: '0 72% 60%',
    'destructive-foreground': '0 0% 0%',
    success: '142.1 70.6% 45.3%',
    'success-foreground': '144.9 80.4% 10%',
    warning: '32.1 94.6% 53.7%',
    'warning-foreground': '0 0% 0%',
    border: '217.2 32.6% 17.5%',
    input: '217.2 32.6% 45%',
    ring: '217.2 91.2% 59.8%',
  },
  'high-contrast-light': {
    background: '0 0% 100%',
    foreground: '0 0% 0%',
    card: '0 0% 100%',
    'card-foreground': '0 0% 0%',
    popover: '0 0% 100%',
    'popover-foreground': '0 0% 0%',
    primary: '221.2 83.2% 32%',
    'primary-foreground': '0 0% 100%',
    secondary: '210 40% 96.1%',
    'secondary-foreground': '0 0% 0%',
    muted: '210 40% 96.1%',
    'muted-foreground': '0 0% 25%',
    accent: '210 40% 96.1%',
    'accent-foreground': '0 0% 0%',
    destructive: '0 84.2% 32%',
    'destructive-foreground': '0 0% 100%',
    success: '142.1 76.2% 22%',
    'success-foreground': '0 0% 100%',
    warning: '32.1 94.6% 50%',
    'warning-foreground': '0 0% 0%',
    border: '0 0% 30%',
    input: '0 0% 0%',
    ring: '0 0% 0%',
  },
  'high-contrast-dark': {
    background: '0 0% 0%',
    foreground: '0 0% 100%',
    card: '0 0% 0%',
    'card-foreground': '0 0% 100%',
    popover: '0 0% 0%',
    'popover-foreground': '0 0% 100%',
    primary: '217.2 91.2% 72%',
    'primary-foreground': '0 0% 0%',
    secondary: '0 0% 15%',
    'secondary-foreground': '0 0% 100%',
    muted: '0 0% 15%',
    'muted-foreground': '0 0% 85%',
    accent: '0 0% 15%',
    'accent-foreground': '0 0% 100%',
    destructive: '0 90% 72%',
    'destructive-foreground': '0 0% 0%',
    success: '142.1 70.6% 68%',
    'success-foreground': '0 0% 0%',
    warning: '32.1 94.6% 68%',
    'warning-foreground': '0 0% 0%',
    border: '0 0% 65%',
    input: '0 0% 100%',
    ring: '0 0% 100%',
  },
};

/** How each pair is used, which decides the contrast ratio it must reach. */
export interface ContrastPair {
  readonly foreground: string;
  readonly background: string;
  readonly kind: 'text' | 'focus' | 'boundary';
  readonly usage: string;
}

/**
 * WCAG 2.1 AA minimum ratios by pair kind. The specification requires 4.5:1
 * for normal text and 3:1 for large text; every text pair below is verified
 * at the stricter 4.5:1, including the pairs that usually carry headings, so
 * the palette keeps headroom for the 3xl to 5xl display steps.
 */
export const CONTRAST_MINIMUMS: Record<'text' | 'focus' | 'boundary', number> = {
  text: 4.5,
  focus: 3,
  boundary: 3,
};

/**
 * The floor the high contrast themes must reach for text pairs. It is AA+
 * (7:1 is the AAA threshold for normal text), which is the point of a high
 * contrast theme: a user who asked for more contrast gets more, not the same.
 */
export const HIGH_CONTRAST_TEXT_MINIMUM = 7;

/**
 * Every foreground and background combination the product renders, with the
 * reason it exists. scripts/checks/color-contrast.mjs computes the WCAG
 * relative luminance ratio of each pair in all four themes and fails verify
 * when a single pair misses its minimum.
 */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  {
    foreground: 'foreground',
    background: 'background',
    kind: 'text',
    usage: 'body and heading text on the page canvas, the most used pair',
  },
  {
    foreground: 'card-foreground',
    background: 'card',
    kind: 'text',
    usage: 'text inside a card, panel or table surface',
  },
  {
    foreground: 'popover-foreground',
    background: 'popover',
    kind: 'text',
    usage: 'text inside a dropdown, popover or dialog',
  },
  {
    foreground: 'secondary-foreground',
    background: 'secondary',
    kind: 'text',
    usage: 'secondary button label and low emphasis badge text',
  },
  {
    foreground: 'muted-foreground',
    background: 'muted',
    kind: 'text',
    usage: 'helper text and table header text on a muted surface',
  },
  {
    foreground: 'muted-foreground',
    background: 'background',
    kind: 'text',
    usage: 'metadata rendered directly on the page canvas',
  },
  {
    foreground: 'muted-foreground',
    background: 'card',
    kind: 'text',
    usage: 'metadata and timestamps inside a card',
  },
  {
    foreground: 'accent-foreground',
    background: 'accent',
    kind: 'text',
    usage: 'menu item label and selected row text on a hover surface',
  },
  {
    foreground: 'primary-foreground',
    background: 'primary',
    kind: 'text',
    usage: 'primary button label and icon',
  },
  {
    foreground: 'destructive-foreground',
    background: 'destructive',
    kind: 'text',
    usage: 'danger button label and icon',
  },
  {
    foreground: 'success-foreground',
    background: 'success',
    kind: 'text',
    usage: 'positive badge label, for example a paid invoice',
  },
  {
    foreground: 'warning-foreground',
    background: 'warning',
    kind: 'text',
    usage: 'attention badge label, for example an overdue invoice',
  },
  {
    foreground: 'primary',
    background: 'background',
    kind: 'text',
    usage: 'link text and active navigation label on the page canvas',
  },
  {
    foreground: 'destructive',
    background: 'background',
    kind: 'text',
    usage: 'destructive link text such as a delete action',
  },
  {
    foreground: 'success',
    background: 'background',
    kind: 'text',
    usage: 'positive amount text, for example a reconciled balance',
  },
  {
    foreground: 'ring',
    background: 'background',
    kind: 'focus',
    usage: 'keyboard focus indicator against the page canvas, WCAG 1.4.11',
  },
  {
    foreground: 'ring',
    background: 'card',
    kind: 'focus',
    usage: 'keyboard focus indicator against a card surface, WCAG 1.4.11',
  },
  {
    foreground: 'input',
    background: 'background',
    kind: 'boundary',
    usage: 'editable field boundary against the page canvas, WCAG 1.4.11',
  },
  {
    foreground: 'input',
    background: 'card',
    kind: 'boundary',
    usage: 'editable field boundary inside a card, WCAG 1.4.11',
  },
];

/** CSS variable every color role becomes: role "card-foreground" -> --card-foreground. */
export const COLOR_ROLE_CSS_VARIABLES: Record<string, string> = mapColorVariables();

function mapColorVariables(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const role of Object.keys(COLOR_ROLES)) {
    result[role] = `--${role}`;
  }
  return result;
}

/** Reason the border role is exempt from the 3:1 boundary rule. */
export const DECORATIVE_BORDER_NOTE =
  'border is a decorative divider: it always accompanies text or spacing that carries the same information, so it is not verified against the 3:1 boundary rule. The input role is the visible boundary of an editable control and is verified.';

/**
 * Z-index and shadow variable names that styles/globals.css must declare.
 * scripts/checks/design-tokens.mjs verifies both directions: every name here
 * exists in the stylesheet with the same value, and the stylesheet declares
 * no --z-* variable that is absent here.
 */
export const REQUIRED_CSS_VARIABLES: Record<string, string> = {
  ...zIndexVariables(),
  ...shadowVariables(),
  ...motionVariables(),
  ...fontFamilyVariables(),
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

function motionVariables(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const token of Object.values(MOTION_DURATION_TOKENS)) {
    result[token.variable] = token.value;
  }
  for (const token of Object.values(MOTION_EASING_TOKENS)) {
    result[token.variable] = token.value;
  }
  return result;
}

function fontFamilyVariables(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const stack of Object.values(FONT_FAMILY_TOKENS)) {
    for (const entry of stack) {
      const match = /^var\((--[a-z0-9-]+)\)$/.exec(entry);
      if (match !== null) {
        result[match[1]] = 'defined';
      }
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
  {
    name: 'layout-width',
    keyCount: Object.keys(LAYOUT_WIDTH_TOKENS).length,
    requiredKeys: REQUIRED_LAYOUT_WIDTH_KEYS,
  },
  {
    name: 'font-size',
    keyCount: Object.keys(FONT_SIZE_TOKENS).length,
    requiredKeys: REQUIRED_FONT_SIZE_KEYS,
  },
  {
    name: 'font-weight',
    keyCount: Object.keys(FONT_WEIGHT_TOKENS).length,
    requiredKeys: ['normal', 'medium', 'semibold', 'bold'],
  },
  {
    name: 'font-family',
    keyCount: Object.keys(FONT_FAMILY_TOKENS).length,
    requiredKeys: ['sans', 'mono'],
  },
  {
    name: 'motion-duration',
    keyCount: Object.keys(MOTION_DURATION_TOKENS).length,
    requiredKeys: REQUIRED_MOTION_DURATION_KEYS,
  },
  {
    name: 'motion-easing',
    keyCount: Object.keys(MOTION_EASING_TOKENS).length,
    requiredKeys: REQUIRED_EASING_KEYS,
  },
  {
    name: 'color-role',
    keyCount: Object.keys(COLOR_ROLES).length,
    requiredKeys: ['background', 'foreground', 'primary', 'primary-foreground', 'ring', 'input'],
  },
  {
    name: 'color-theme',
    keyCount: COLOR_THEME_NAMES.length,
    requiredKeys: [...COLOR_THEME_NAMES],
  },
  {
    name: 'contrast-pair',
    keyCount: CONTRAST_PAIRS.length,
    requiredKeys: ['foreground/background', 'primary-foreground/primary', 'ring/background'],
  },
];
