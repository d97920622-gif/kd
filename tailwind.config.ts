// path: tailwind.config.ts
import { type Config } from 'tailwindcss';

import {
  DURATION_CLASS_MAP,
  EASING_CLASS_MAP,
  FONT_FAMILY_CLASS_MAP,
  FONT_SIZE_CLASS_MAP,
  FONT_WEIGHT_CLASS_MAP,
  MAX_WIDTH_CLASS_MAP,
  MIN_WIDTH_CLASS_MAP,
  RADIUS_CLASS_MAP,
  SHADOW_CLASS_MAP,
  SPACING_TOKENS,
  WIDTH_CLASS_MAP,
  Z_INDEX_CLASS_MAP,
} from './config/design-tokens.ts';

/**
 * Tailwind CSS configuration for KD SOLUTION IT.
 *
 * Every scale in this file comes from config/design-tokens.ts. No scale
 * value is declared here, so there is exactly one place to change a token
 * and exactly one place for scripts/checks/design-tokens.mjs to verify.
 *
 * The import carries the .ts extension on purpose. Without it the loader that
 * evaluates this file resolves the specifier against every sibling of
 * config/design-tokens.ts, including the generated config/design-tokens.json,
 * and a silent switch to that file would disconnect the whole token system
 * from Tailwind. scripts/checks/design-tokens.mjs fails any extensionless
 * import of the token module for the same reason.
 *
 * Spacing, radius, shadow, z-index, typography, motion and weight are
 * replaced rather than extended: the default Tailwind steps that are not
 * tokens do not exist, which turns a mistyped step (p-7, text-md,
 * duration-350) into a visibly unstyled element instead of a silent
 * off-scale value. Semantic colors stay bound to the CSS variables declared
 * in styles/globals.css, which carry the light, dark and high contrast
 * values from the same token module.
 */
const config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './config/**/*.{ts,tsx}',
  ],
  theme: {
    // Single breakpoint system for the whole platform, mobile first.
    // MASTER_PROMPT: 320 / 375 / 430 / 768 / 1024 / 1280 / 1920.
    screens: {
      '2xs': '320px',
      xs: '375px',
      sm: '430px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1920px',
    },
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px',
      },
    },
    spacing: SPACING_TOKENS,
    borderRadius: RADIUS_CLASS_MAP,
    boxShadow: SHADOW_CLASS_MAP,
    zIndex: Z_INDEX_CLASS_MAP,
    fontSize: FONT_SIZE_CLASS_MAP,
    fontFamily: FONT_FAMILY_CLASS_MAP,
    fontWeight: FONT_WEIGHT_CLASS_MAP,
    transitionDuration: DURATION_CLASS_MAP,
    transitionTimingFunction: EASING_CLASS_MAP,
    extend: {
      // Panel widths keep the Tailwind defaults (fractions, auto, full) and
      // add the named surfaces from LAYOUT_WIDTH_TOKENS on top.
      width: WIDTH_CLASS_MAP,
      minWidth: MIN_WIDTH_CLASS_MAP,
      maxWidth: MAX_WIDTH_CLASS_MAP,
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
