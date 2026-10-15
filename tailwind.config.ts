// path: tailwind.config.ts
import { type Config } from 'tailwindcss';

import {
  RADIUS_CLASS_MAP,
  SHADOW_CLASS_MAP,
  SPACING_TOKENS,
  Z_INDEX_CLASS_MAP,
} from './config/design-tokens';

/**
 * Tailwind CSS configuration for KD SOLUTION IT.
 *
 * Every scale in this file comes from config/design-tokens.ts. No scale
 * value is declared here, so there is exactly one place to change a token
 * and exactly one place for scripts/checks/design-tokens.mjs to verify.
 *
 * Spacing, radius, shadow and z-index are replaced rather than extended: the
 * default Tailwind steps that are not tokens do not exist, which turns a
 * mistyped step (p-7) into a visibly unstyled element instead of a silent
 * off-scale value. Semantic colors stay bound to the CSS variables declared
 * in styles/globals.css.
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
    extend: {
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
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
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
