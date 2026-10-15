// path: postcss.config.js
/**
 * PostCSS pipeline for KD SOLUTION IT.
 * Tailwind CSS generates the utilities; Autoprefixer adds vendor prefixes.
 * No other PostCSS plugin may be added without an ADR (supply chain policy).
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
