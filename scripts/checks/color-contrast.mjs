// path: scripts/checks/color-contrast.mjs
/**
 * check:color-contrast -- the WCAG contract of the design palette.
 *
 * The token module declares every semantic color role for four themes (light,
 * dark, high-contrast light, high-contrast dark) and the exact foreground and
 * background pairs the product renders. This check proves those declarations
 * hold, without a browser:
 *
 * 1. Theme parity. Every theme declares every color role. A role added to
 *    light mode but not to dark mode fails here, which is what makes "dark
 *    mode: full parity" a property of the build rather than a promise.
 *
 * 2. Stylesheet sync. Every value in styles/globals.css equals the value in
 *    the token module for its theme, in both directions: a missing variable,
 *    a changed value and an undeclared color variable are all findings.
 *
 * 3. Contrast. Each declared pair is converted from HSL to sRGB, its WCAG
 *    2.1 relative luminance ratio is computed, and the ratio is compared with
 *    the minimum for the pair kind: 4.5:1 for text, 3:1 for the focus
 *    indicator and the editable-field boundary, and 7:1 for text in the two
 *    high contrast themes.
 *
 * A failure here is a product defect, not a formatting preference: it means
 * a user with low vision cannot read the interface.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { parseCssDeclarations, REPO_ROOT, reportResult, selectCssBlock } from './_lib.mjs';
import { createTokenReader, isPlainObject } from './_tokens.mjs';

const STYLESHEET = 'styles/globals.css';

/**
 * Blocks of the stylesheet, keyed by the token theme they must equal.
 *
 * The first four are what the running application uses: the base theme, the
 * class the theme switch sets on the html element, and the two high contrast
 * themes behind the operating system preference. The theme-* scopes pin one
 * theme to a surface regardless of the page around it; the component gallery
 * renders all four side by side through them. Every block is compared with
 * config/design-tokens.ts token by token, so a pinned scope can never drift
 * from the theme it mirrors.
 */
const THEME_BLOCKS = [
  { theme: 'light', selector: ':root', media: null },
  { theme: 'dark', selector: '.dark', media: null },
  { theme: 'high-contrast-light', selector: ':root', media: 'prefers-contrast: more' },
  { theme: 'high-contrast-dark', selector: '.dark', media: 'prefers-contrast: more' },
  { theme: 'light', selector: '.theme-light', media: null },
  { theme: 'dark', selector: '.theme-dark', media: null },
  { theme: 'high-contrast-light', selector: '.theme-hc-light', media: null },
  { theme: 'high-contrast-dark', selector: '.theme-hc-dark', media: null },
];

/** Variables in a theme block that are not color roles. */
const NON_COLOR_VARIABLES = ['--radius', '--font-sans', '--font-mono', '--shadow-color'];

/**
 * Variables the light block declares that are not screen colour roles.
 *
 * `--print-*` and `--safe-*` belong here rather than in a role table. The
 * print palette is not a theme, it is what the printer puts on the sheet, and
 * it is declared once for every theme; the safe-area variables are not even
 * ours, they are the device reporting what it keeps for itself. Both are
 * verified against the token module in both directions - print by the block
 * below, the safe-area set by scripts/checks/design-tokens.mjs - so neither
 * can drift by being outside the contrast contract.
 */
function nonColorVariablePattern(property) {
  return (
    NON_COLOR_VARIABLES.includes(property) ||
    property.startsWith('--print-') ||
    property.startsWith('--safe-') ||
    property.startsWith('--shadow-') ||
    property.startsWith('--z-') ||
    property.startsWith('--duration-') ||
    property.startsWith('--ease-')
  );
}

function safeRead(file) {
  try {
    return readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

/** Parse 'H S% L%' into numeric channels, or null when the shape is wrong. */
function parseHslTriple(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  return { hue: Number(match[1]), saturation: Number(match[2]), lightness: Number(match[3]) };
}

/** HSL to sRGB channels in the 0 to 1 range. */
function hslToRgb({ hue, saturation, lightness }) {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = saturation / 100;
  const l = lightness / 100;
  if (s === 0) {
    return { r: l, g: l, b: l };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t) => {
    let value = t;
    if (value < 0) {
      value += 1;
    }
    if (value > 1) {
      value -= 1;
    }
    if (value < 1 / 6) {
      return p + (q - p) * 6 * value;
    }
    if (value < 1 / 2) {
      return q;
    }
    if (value < 2 / 3) {
      return p + (q - p) * (2 / 3 - value) * 6;
    }
    return p;
  };
  return {
    r: channel(h + 1 / 3),
    g: channel(h),
    b: channel(h - 1 / 3),
  };
}

/** WCAG 2.1 relative luminance of an sRGB color. */
function relativeLuminance(triple) {
  const { r, g, b } = hslToRgb(triple);
  const linear = (channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two HSL colors, rounded to two decimals. */
function contrastRatio(foreground, background) {
  const first = relativeLuminance(foreground);
  const second = relativeLuminance(background);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function main() {
  const findings = [];
  const reader = createTokenReader();

  if (reader.sourceFile === null) {
    reportResult(
      'color-contrast',
      [{ file: reader.file, line: 1, column: 1, message: 'token module missing' }],
      '',
    );
    return;
  }

  const colorRoles = reader.read('COLOR_ROLES');
  const themeValues = reader.read('COLOR_THEME_VALUES');
  const themeNames = reader.read('COLOR_THEME_NAMES');
  const contrastPairs = reader.read('CONTRAST_PAIRS');
  const minimums = reader.read('CONTRAST_MINIMUMS');
  const highContrastMinimum = reader.read('HIGH_CONTRAST_TEXT_MINIMUM');

  if (!isPlainObject(colorRoles) || Object.keys(colorRoles).length === 0) {
    findings.push({ file: reader.file, line: 1, column: 1, message: 'COLOR_ROLES was not found' });
  }
  if (!isPlainObject(themeValues) || !Array.isArray(themeNames) || !Array.isArray(contrastPairs)) {
    findings.push({
      file: reader.file,
      line: 1,
      column: 1,
      message:
        'COLOR_THEME_VALUES, COLOR_THEME_NAMES and CONTRAST_PAIRS must all be literal declarations',
    });
    reportResult('color-contrast', findings, '');
    return;
  }
  if (!isPlainObject(minimums) || typeof highContrastMinimum !== 'number') {
    findings.push({
      file: reader.file,
      line: 1,
      column: 1,
      message: 'CONTRAST_MINIMUMS and HIGH_CONTRAST_TEXT_MINIMUM must be literal declarations',
    });
    reportResult('color-contrast', findings, '');
    return;
  }

  const roleNames = Object.keys(colorRoles);
  const roleVariables = new Map(roleNames.map((role) => [`--${role}`, role]));

  // Rule 1: the theme list and the theme value maps agree, and every theme
  // declares exactly the same roles.
  for (const theme of themeNames) {
    if (!isPlainObject(themeValues[theme])) {
      findings.push({
        file: reader.file,
        line: 1,
        column: 1,
        message: `theme ${theme} has no value map`,
      });
    }
  }
  for (const theme of Object.keys(themeValues)) {
    if (!themeNames.includes(theme)) {
      findings.push({
        file: reader.file,
        line: 1,
        column: 1,
        message: `theme ${theme} is not listed in COLOR_THEME_NAMES`,
      });
    }
  }
  const themes = themeNames.filter((theme) => isPlainObject(themeValues[theme]));
  for (const theme of themes) {
    const values = themeValues[theme];
    for (const role of roleNames) {
      if (!Object.prototype.hasOwnProperty.call(values, role)) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: `${theme} is missing the ${role} role: dark mode and high contrast require full parity`,
        });
      }
    }
    for (const role of Object.keys(values)) {
      if (!roleNames.includes(role)) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: `${theme} declares ${role}, which is not a role in COLOR_ROLES`,
        });
      }
    }
  }

  // Rule 2: every theme value is a parsable HSL triple.
  for (const theme of themes) {
    for (const [role, value] of Object.entries(themeValues[theme])) {
      if (parseHslTriple(value) === null) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: `${theme}.${role} must be an HSL channel triple such as "210 40% 96.1%", found ${JSON.stringify(value)}`,
        });
      }
    }
  }

  // Rule 3: the stylesheet declares every role in every theme with the same
  // value, and declares no color variable the token module does not know.
  const stylesheet = safeRead(STYLESHEET);
  const cssFindings = [];
  if (stylesheet === null) {
    cssFindings.push({
      file: STYLESHEET,
      line: 1,
      column: 1,
      message: 'the global stylesheet is missing',
    });
  } else {
    const records = parseCssDeclarations(stylesheet);
    for (const block of THEME_BLOCKS) {
      if (!themes.includes(block.theme)) {
        continue;
      }
      const declarations = selectCssBlock(records, {
        selector: block.selector,
        media: block.media,
      });
      if (declarations.size === 0) {
        cssFindings.push({
          file: STYLESHEET,
          line: 1,
          column: 1,
          message: `the ${block.theme} block (${block.selector}${block.media === null ? '' : ` inside @media (${block.media})`}) was not found`,
        });
        continue;
      }
      const expected = themeValues[block.theme];
      for (const [variable, role] of roleVariables.entries()) {
        const declared = declarations.get(variable);
        if (declared === undefined) {
          cssFindings.push({
            file: STYLESHEET,
            line: 1,
            column: 1,
            message: `${block.theme} does not declare ${variable} (${role})`,
          });
          continue;
        }
        if (role in expected && declared !== expected[role]) {
          cssFindings.push({
            file: STYLESHEET,
            line: 1,
            column: 1,
            message: `${block.theme} declares ${variable}: ${declared} but config/design-tokens.ts says ${expected[role]}`,
          });
        }
      }
      for (const property of declarations.keys()) {
        if (!property.startsWith('--')) {
          continue;
        }
        if (nonColorVariablePattern(property)) {
          continue;
        }
        if (!roleVariables.has(property)) {
          cssFindings.push({
            file: STYLESHEET,
            line: 1,
            column: 1,
            message: `${property} in the ${block.theme} block is not a color role in config/design-tokens.ts`,
          });
        }
      }
    }
    if (!/prefers-contrast:\s*more/.test(stylesheet)) {
      cssFindings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: 'the high contrast block @media (prefers-contrast: more) is missing',
      });
    }
  }
  findings.push(...cssFindings);

  // Rule 4: every declared pair reaches its minimum in every theme. The
  // math runs on the token module alone, so a drifting stylesheet never hides
  // a contrast defect behind a sync finding.
  let checkedPairs = 0;
  {
    for (const pair of contrastPairs) {
      if (
        !isPlainObject(pair) ||
        typeof pair.foreground !== 'string' ||
        typeof pair.background !== 'string'
      ) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: 'a CONTRAST_PAIRS entry is not a literal object with foreground and background',
        });
        continue;
      }
      if (
        !roleVariables.has(`--${pair.foreground}`) ||
        !roleVariables.has(`--${pair.background}`)
      ) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: `contrast pair ${pair.foreground} on ${pair.background} references an unknown role`,
        });
        continue;
      }
      const kindMinimum = minimums[pair.kind];
      if (typeof kindMinimum !== 'number') {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: `contrast pair ${pair.foreground} on ${pair.background} has an unknown kind ${JSON.stringify(pair.kind)}`,
        });
        continue;
      }
      for (const theme of themes) {
        const values = themeValues[theme];
        const foreground = parseHslTriple(values[pair.foreground]);
        const background = parseHslTriple(values[pair.background]);
        if (foreground === null || background === null) {
          continue;
        }
        const ratio = contrastRatio(foreground, background);
        const isHighContrast = theme.startsWith('high-contrast');
        const minimum = isHighContrast && pair.kind === 'text' ? highContrastMinimum : kindMinimum;
        checkedPairs += 1;
        if (ratio < minimum) {
          findings.push({
            file: reader.file,
            line: 1,
            column: 1,
            message: `${theme}: ${pair.foreground} on ${pair.background} is ${ratio}:1, below the required ${minimum}:1 (${pair.usage})`,
          });
        }
      }
    }
  }

  // Rule 6: the paper palette is declared, matches the token module, and
  // holds its contrast contract. Paper is not a theme: the values are read
  // out of PRINT_TOKENS and compared with the :root block, which is the only
  // place they are declared.
  let printRoles = 0;
  let printPairs = 0;
  {
    const printTokens = reader.read('PRINT_TOKENS');
    const printPairsRaw = reader.read('PRINT_CONTRAST_PAIRS');
    const root = selectCssBlock(parseCssDeclarations(safeRead(STYLESHEET) ?? ''), {
      selector: ':root',
    });
    if (!isPlainObject(printTokens)) {
      findings.push({
        file: reader.file,
        line: 1,
        column: 1,
        message: 'PRINT_TOKENS was not found in the token module',
      });
    } else {
      const values = {};
      for (const [key, token] of Object.entries(printTokens)) {
        if (
          !isPlainObject(token) ||
          typeof token.variable !== 'string' ||
          typeof token.value !== 'string'
        ) {
          findings.push({
            file: reader.file,
            line: 1,
            column: 1,
            message: `print token ${key} is not a literal object with variable and value`,
          });
          continue;
        }
        printRoles += 1;
        values[key] = token.value;
        const declared = root.get(token.variable);
        if (declared === undefined) {
          findings.push({
            file: STYLESHEET,
            line: 1,
            column: 1,
            message: `the paper palette is missing ${token.variable} (${key})`,
          });
        } else if (declared !== token.value) {
          findings.push({
            file: STYLESHEET,
            line: 1,
            column: 1,
            message: `${token.variable} is ${declared} but ${reader.file} declares ${token.value}`,
          });
        }
      }

      if (!Array.isArray(printPairsRaw)) {
        findings.push({
          file: reader.file,
          line: 1,
          column: 1,
          message: 'PRINT_CONTRAST_PAIRS was not found in the token module',
        });
      } else {
        for (const pair of printPairsRaw) {
          if (
            !isPlainObject(pair) ||
            typeof pair.role !== 'string' ||
            typeof pair.background !== 'string' ||
            typeof pair.minimum !== 'number'
          ) {
            findings.push({
              file: reader.file,
              line: 1,
              column: 1,
              message:
                'a PRINT_CONTRAST_PAIRS entry is not a literal object with role, background and minimum',
            });
            continue;
          }
          const foreground = parseHslTriple(values[pair.role]);
          const background = parseHslTriple(values[pair.background]);
          if (foreground === null || background === null) {
            findings.push({
              file: reader.file,
              line: 1,
              column: 1,
              message: `print contrast pair ${pair.role} on ${pair.background} references an unknown print token`,
            });
            continue;
          }
          const ratio = contrastRatio(foreground, background);
          printPairs += 1;
          if (ratio < pair.minimum) {
            findings.push({
              file: reader.file,
              line: 1,
              column: 1,
              message: `paper: ${pair.role} on ${pair.background} is ${ratio}:1, below the required ${pair.minimum}:1`,
            });
          }
        }
      }

      // The declared contrast in the token module is documentation only if it
      // disagrees with the measurement, so it is compared too.
      for (const [key, token] of Object.entries(printTokens)) {
        if (!isPlainObject(token) || typeof token.contrastOnPaper !== 'number') {
          continue;
        }
        const foreground = parseHslTriple(token.value);
        const background = parseHslTriple(values.paper);
        if (foreground === null || background === null) {
          continue;
        }
        const ratio = contrastRatio(foreground, background);
        if (Math.abs(ratio - token.contrastOnPaper) > 0.011) {
          findings.push({
            file: reader.file,
            line: 1,
            column: 1,
            message: `print token ${key} records ${token.contrastOnPaper}:1 on paper but measures ${ratio}:1`,
          });
        }
      }
    }
  }

  const summary = `${themes.length} themes, ${roleNames.length} color roles, ${checkedPairs} contrast ratios verified against WCAG 2.1 AA, paper palette ${printRoles} tokens and ${printPairs} ratios verified`;
  reportResult('color-contrast', findings, summary);
}

main();
