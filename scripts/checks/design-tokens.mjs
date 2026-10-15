// path: scripts/checks/design-tokens.mjs
/**
 * check:design-tokens -- design token discipline.
 *
 * Four verifications, all derived from config/design-tokens.ts and
 * tailwind.config.ts parsed with the TypeScript compiler API:
 *
 * 1. Token source integrity. The mandated scale members exist: spacing
 *    4/8/12/16/24/32/48/64, radius none/sm/md/lg/xl/full, shadow
 *    sm/md/lg/xl/2xl and the eight required z-index layers. The z-index
 *    ladder is strictly ascending and has no duplicate value, so two layers
 *    can never fight for the same stacking position.
 *
 * 2. Configuration wiring. tailwind.config.ts must take spacing, borderRadius,
 *    boxShadow and zIndex from config/design-tokens.ts by identifier. An
 *    inline literal scale reappearing in the config fails the check.
 *
 * 3. No arbitrary Tailwind values in application code. A class such as
 *    p-[13px] or z-[9999] is rejected. Bracket values that reference a token
 *    through a CSS variable (var(--...)), that define one (--name: ...), or
 *    that are the empty content of a pseudo-element (content-[''], which
 *    renders nothing and only widens a pointer target) are allowed, because
 *    they consume the token system rather than bypass it. A bracket in the
 *    variant position, such as data-[state=checked]:bg-primary, is a state
 *    selector and is not a value at all.
 *
 * 4. No raw color or spacing literals in application code: hex colors,
 *    rgb()/hsl() literals and inline style values are rejected outside the
 *    three files that define tokens (styles/globals.css,
 *    config/design-tokens.ts, tailwind.config.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import {
  listTrackedFiles,
  parseCssDeclarations,
  positionOf,
  reportResult,
  REPO_ROOT,
  selectCssBlock,
} from './_lib.mjs';
import { createTokenReader, isPlainObject } from './_tokens.mjs';

const SELF = 'scripts/checks/design-tokens.mjs';
const TOKEN_FILE = 'config/design-tokens.ts';
const TAILWIND_CONFIG = 'tailwind.config.ts';

/** Files allowed to hold raw values: they define the tokens. */
const VALUE_ALLOWLIST = [SELF, TOKEN_FILE, TAILWIND_CONFIG, 'styles/globals.css'];

const SCAN_ROOTS = ['app/', 'components/', 'lib/', 'config/'];
const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

/**
 * The mandated spacing scale, key to value. Both halves are checked: renaming
 * a step while keeping its value would produce an off-scale class such as
 * p-9 for 48px, which is exactly what the scale exists to prevent.
 */
const REQUIRED_SPACING_SCALE = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
};
const REQUIRED_RADIUS_KEYS = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
const REQUIRED_SHADOW_KEYS = ['sm', 'md', 'lg', 'xl', '2xl'];
const REQUIRED_Z_LAYERS = [
  'base',
  'sticky',
  'overlay',
  'modal',
  'dropdown',
  'popover',
  'tooltip',
  'toast',
];

const EXPECTED_TAILWIND_SCALES = [
  { property: 'spacing', identifier: 'SPACING_TOKENS' },
  { property: 'borderRadius', identifier: 'RADIUS_CLASS_MAP' },
  { property: 'boxShadow', identifier: 'SHADOW_CLASS_MAP' },
  { property: 'zIndex', identifier: 'Z_INDEX_CLASS_MAP' },
  { property: 'fontSize', identifier: 'FONT_SIZE_CLASS_MAP' },
  { property: 'fontFamily', identifier: 'FONT_FAMILY_CLASS_MAP' },
  { property: 'fontWeight', identifier: 'FONT_WEIGHT_CLASS_MAP' },
  { property: 'transitionDuration', identifier: 'DURATION_CLASS_MAP' },
  { property: 'transitionTimingFunction', identifier: 'EASING_CLASS_MAP' },
];

const STYLESHEET = 'styles/globals.css';

const ARBITRARY_VALUE_PATTERN = /\[([^[\]\n]{1,80})\]/g;
const HEX_COLOR_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const CSS_FUNCTION_COLOR_PATTERN = /\b(?:rgba?|hsla?)\((?!\s*var\(--)/g;

function safeRead(file) {
  try {
    return readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

function parseSource(file, text) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
}

function unwrap(node) {
  let current = node;
  while (
    current !== undefined &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isParenthesizedExpression(current) ||
      ts.isTypeAssertionExpression(current))
  ) {
    current = current.expression;
  }
  return current;
}

function stringValueOf(node) {
  if (
    node !== undefined &&
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
  ) {
    return node.text;
  }
  return null;
}

function numberValueOf(node) {
  if (node !== undefined && ts.isNumericLiteral(node)) {
    return Number(node.text);
  }
  if (node !== undefined && ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text);
    return node.operator === ts.SyntaxKind.MinusToken ? -value : value;
  }
  return null;
}

/** Read a top-level `export const NAME = { ... }` object as a key map. */
function readExportedObject(sourceFile, text, constName) {
  let result = null;
  const visit = (node) => {
    if (result !== null) {
      return;
    }
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === constName) {
          const initializer = unwrap(declaration.initializer);
          if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
            const entries = new Map();
            for (const property of initializer.properties) {
              if (!ts.isPropertyAssignment(property)) {
                continue;
              }
              const keyNode = property.name;
              const key =
                ts.isIdentifier(keyNode) || ts.isStringLiteral(keyNode) ? keyNode.text : null;
              if (key === null) {
                continue;
              }
              const value = unwrap(property.initializer);
              const literal = stringValueOf(value) ?? numberValueOf(value);
              const nested = ts.isObjectLiteralExpression(value)
                ? readObjectField(value, 'value')
                : undefined;
              entries.set(key, { literal, nested, node: property });
            }
            result = entries;
            return;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
}

/** Read one field of an object literal whose values are objects. */
function readObjectField(objectLiteral, fieldName) {
  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const key =
      ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : null;
    if (key !== fieldName) {
      continue;
    }
    const value = unwrap(property.initializer);
    const literal = stringValueOf(value) ?? numberValueOf(value);
    return literal ?? undefined;
  }
  return undefined;
}

function checkTokenSource(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);

  const spacingScale = readExportedObject(sourceFile, text, 'SPACING_SCALE_TOKENS');
  if (spacingScale === null) {
    findings.push({ file, line: 1, column: 1, message: 'SPACING_SCALE_TOKENS was not found' });
  } else {
    for (const [key, expected] of Object.entries(REQUIRED_SPACING_SCALE)) {
      const entry = spacingScale.get(key);
      const actual = entry === undefined ? undefined : (entry.nested ?? entry.literal);
      if (actual === undefined) {
        findings.push({
          file,
          line: 1,
          column: 1,
          message: `the mandated spacing scale is missing the ${key} step (${expected})`,
        });
        continue;
      }
      if (actual !== expected) {
        const { line, column } = positionOf(text, entry.node.getStart(sourceFile));
        findings.push({
          file,
          line,
          column,
          message: `spacing step ${key} is ${actual} but the mandated scale requires ${expected}`,
        });
      }
    }
  }

  const radius = readExportedObject(sourceFile, text, 'RADIUS_TOKENS');
  if (radius === null) {
    findings.push({ file, line: 1, column: 1, message: 'RADIUS_TOKENS was not found' });
  } else {
    for (const required of REQUIRED_RADIUS_KEYS) {
      if (!radius.has(required)) {
        findings.push({
          file,
          line: 1,
          column: 1,
          message: `the radius scale is missing the ${required} step`,
        });
      }
    }
  }

  const shadows = readExportedObject(sourceFile, text, 'SHADOW_TOKENS');
  if (shadows === null) {
    findings.push({ file, line: 1, column: 1, message: 'SHADOW_TOKENS was not found' });
  } else {
    for (const required of REQUIRED_SHADOW_KEYS) {
      if (!shadows.has(required)) {
        findings.push({
          file,
          line: 1,
          column: 1,
          message: `the shadow scale is missing the ${required} step`,
        });
      }
    }
  }

  const layers = readExportedObject(sourceFile, text, 'Z_INDEX_TOKENS');
  if (layers === null) {
    findings.push({ file, line: 1, column: 1, message: 'Z_INDEX_TOKENS was not found' });
  } else {
    for (const required of REQUIRED_Z_LAYERS) {
      if (!layers.has(required)) {
        findings.push({
          file,
          line: 1,
          column: 1,
          message: `the z-index ladder is missing the ${required} layer`,
        });
      }
    }
    const seenValues = new Map();
    let previous = Number.NEGATIVE_INFINITY;
    for (const [key, entry] of layers.entries()) {
      const value = entry.nested ?? entry.literal;
      if (typeof value !== 'number') {
        const { line, column } = positionOf(text, entry.node.getStart(sourceFile));
        findings.push({
          file,
          line,
          column,
          message: `z-index layer ${key} must declare a numeric value`,
        });
        continue;
      }
      if (seenValues.has(value)) {
        const { line, column } = positionOf(text, entry.node.getStart(sourceFile));
        findings.push({
          file,
          line,
          column,
          message: `z-index value ${value} is used by both ${seenValues.get(value)} and ${key}`,
        });
      }
      seenValues.set(value, key);
      if (value <= previous) {
        const { line, column } = positionOf(text, entry.node.getStart(sourceFile));
        findings.push({
          file,
          line,
          column,
          message: `z-index layer ${key} (${value}) must be above the previous layer (${previous})`,
        });
      }
      previous = value;
    }
  }

  return findings;
}

function checkTailwindConfig(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);
  const tokenModuleSpecifier = './config/design-tokens.ts';
  const importsTokenModule = sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === tokenModuleSpecifier,
  );
  if (!importsTokenModule) {
    findings.push({
      file,
      line: 1,
      column: 1,
      message: `tailwind.config.ts must import its scales from ${tokenModuleSpecifier}, with the extension, so no sibling file can shadow the module`,
    });
  }

  const assignments = new Map();
  const visit = (node) => {
    if (ts.isPropertyAssignment(node)) {
      const key =
        ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : null;
      if (key !== null && EXPECTED_TAILWIND_SCALES.some((entry) => entry.property === key)) {
        const value = unwrap(node.initializer);
        assignments.set(key, value);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  for (const expected of EXPECTED_TAILWIND_SCALES) {
    const value = assignments.get(expected.property);
    if (value === undefined) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message: `theme.${expected.property} is not wired to the design tokens`,
      });
      continue;
    }
    const isIdentifier = ts.isIdentifier(value) && value.text === expected.identifier;
    if (!isIdentifier) {
      const { line, column } = positionOf(text, value.getStart(sourceFile));
      findings.push({
        file,
        line,
        column,
        message: `theme.${expected.property} must be the ${expected.identifier} identifier, not an inline scale`,
      });
    }
  }
  return findings;
}

/**
 * Bracket values that consume the token system instead of bypassing it:
 *
 *   var(--token)      an existing CSS variable, for example the Radix
 *                     measured width of a select trigger;
 *   --name: value     a variable definition inside a bracket;
 *   '' or ""          the empty content of a pseudo-element, used to give a
 *                     small control a larger pointer target. It carries no
 *                     design value: nothing is rendered.
 */
function isAllowedBracketValue(inner) {
  const trimmed = inner.trim();
  if (trimmed.startsWith('--')) {
    return true;
  }
  if (trimmed === "''" || trimmed === '""') {
    return true;
  }
  return trimmed.includes('var(--');
}

/**
 * True when a bracket is a variant selector rather than a value: the
 * character right after the closing bracket is a colon, as in
 * data-[state=checked]:bg-primary or [&_svg]:size-4. A bracket in the variant
 * position selects a state and cannot carry a raw design value, so it is not
 * inspected; a bracket at the end of the utility is a value and must be a
 * token reference.
 */
function isVariantBracket(text, matchIndex, matchLength) {
  return text[matchIndex + matchLength] === ':';
}

/**
 * Numeric style properties whose numeric literal is a raw length. Opacity,
 * weight, order and line count are unitless and are not flagged.
 */
const LENGTH_STYLE_PROPERTY =
  /^(?:margin|padding|top|right|bottom|left|inset|width|height|minWidth|maxWidth|minHeight|maxHeight|gap|rowGap|columnGap|fontSize|lineHeight|borderRadius|borderWidth|zIndex|translate|flexBasis)/;

/** Class-composing helpers whose string arguments are class lists. */
const CLASS_HELPERS = new Set(['cn', 'clsx', 'cva', 'classNames', 'twMerge', 'tv']);

function collectStringsFromExpression(expression, sourceFile, out) {
  const value = unwrap(expression);
  if (value === undefined) {
    return;
  }
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    out.push({
      text: value.text,
      start: value.getStart(sourceFile),
      raw: value.getText(sourceFile),
    });
    return;
  }
  if (ts.isTemplateExpression(value)) {
    const parts = [value.head.text, ...value.templateSpans.map((span) => span.literal.text)].join(
      ' ',
    );
    out.push({ text: parts, start: value.getStart(sourceFile), raw: value.getText(sourceFile) });
    return;
  }
  if (ts.isConditionalExpression(value)) {
    collectStringsFromExpression(value.whenTrue, sourceFile, out);
    collectStringsFromExpression(value.whenFalse, sourceFile, out);
    return;
  }
  if (ts.isBinaryExpression(value)) {
    collectStringsFromExpression(value.left, sourceFile, out);
    collectStringsFromExpression(value.right, sourceFile, out);
    return;
  }
  if (ts.isCallExpression(value)) {
    for (const argument of value.arguments) {
      collectStringsFromExpression(argument, sourceFile, out);
    }
    return;
  }
  if (ts.isArrayLiteralExpression(value)) {
    for (const element of value.elements) {
      collectStringsFromExpression(element, sourceFile, out);
    }
    return;
  }
  if (ts.isObjectLiteralExpression(value)) {
    for (const property of value.properties) {
      if (ts.isPropertyAssignment(property)) {
        collectStringsFromExpression(property.initializer, sourceFile, out);
      }
    }
  }
}

/**
 * Class strings that matter for token discipline: className values and the
 * string arguments of the class-composing helpers. Restricting the sources
 * keeps the check precise, so prose, paths and file names are never scanned
 * for Tailwind syntax.
 */
function collectClassStrings(sourceFile) {
  const out = [];
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'className') {
      const initializer = node.initializer;
      if (initializer !== undefined) {
        if (ts.isStringLiteral(initializer) || ts.isNoSubstitutionTemplateLiteral(initializer)) {
          out.push({
            text: initializer.text,
            start: initializer.getStart(sourceFile),
            raw: initializer.getText(sourceFile),
          });
        } else if (ts.isJsxExpression(initializer)) {
          const expression = unwrap(initializer.expression);
          const isHelperCall =
            expression !== undefined &&
            ts.isCallExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            CLASS_HELPERS.has(expression.expression.text);
          // A helper call is already collected through the call branch.
          if (!isHelperCall) {
            collectStringsFromExpression(initializer.expression, sourceFile, out);
          }
        }
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      CLASS_HELPERS.has(node.expression.text)
    ) {
      for (const argument of node.arguments) {
        collectStringsFromExpression(argument, sourceFile, out);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return out;
}

function checkArbitraryValues(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);
  for (const entry of collectClassStrings(sourceFile)) {
    ARBITRARY_VALUE_PATTERN.lastIndex = 0;
    let match = ARBITRARY_VALUE_PATTERN.exec(entry.text);
    while (match !== null) {
      const inner = match[1];
      const isVariant = isVariantBracket(entry.text, match.index, match[0].length);
      if (!isVariant && !isAllowedBracketValue(inner)) {
        const offset = entry.start + findOffsetInRaw(entry, match[0]);
        const { line, column } = positionOf(text, offset);
        findings.push({
          file,
          line,
          column,
          message: `arbitrary Tailwind value [${inner}] is not a token; add a token to config/design-tokens.ts or reference a CSS variable`,
        });
      }
      match = ARBITRARY_VALUE_PATTERN.exec(entry.text);
    }
  }
  return findings;
}

/** Best-effort offset of a class token inside the source text. */
function findOffsetInRaw(entry, token) {
  const marker = token.split('[')[0];
  const index = entry.raw.indexOf(marker);
  if (entry.raw.length > 0 && index >= 0) {
    return index;
  }
  const inText = entry.text.indexOf(token);
  return inText >= 0 ? inText : 0;
}

function checkRawValues(file, text) {
  const findings = [];
  for (const pattern of [HEX_COLOR_PATTERN, CSS_FUNCTION_COLOR_PATTERN]) {
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match !== null) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `raw color literal "${match[0]}" is forbidden; use a token from styles/globals.css`,
      });
      match = pattern.exec(text);
    }
  }
  return findings;
}

function checkInlineStyles(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);
  const visit = (node) => {
    if (ts.isJsxAttribute(node) && node.name.getText(sourceFile) === 'style') {
      const initializer = node.initializer;
      if (
        initializer !== undefined &&
        ts.isJsxExpression(initializer) &&
        initializer.expression !== undefined
      ) {
        const expression = unwrap(initializer.expression);
        if (expression !== undefined && ts.isObjectLiteralExpression(expression)) {
          for (const property of expression.properties) {
            if (!ts.isPropertyAssignment(property)) {
              continue;
            }
            const value = unwrap(property.initializer);
            const literal = stringValueOf(value);
            const numeric = numberValueOf(value);
            const propertyName =
              ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                ? property.name.text
                : '';
            const rawColor =
              literal !== null && /#|rgba?\(|hsla?\(/.test(literal) && !literal.includes('var(--');
            const rawLength =
              literal !== null && /\d+px/.test(literal) && !literal.includes('var(--');
            const rawLengthNumber = numeric !== null && LENGTH_STYLE_PROPERTY.test(propertyName);
            const flagged = rawColor || rawLength || rawLengthNumber;
            if (flagged) {
              const { line, column } = positionOf(text, property.getStart(sourceFile));
              findings.push({
                file,
                line,
                column,
                message:
                  'inline style with a raw value is forbidden; use a token class or a CSS variable',
              });
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

/**
 * Verify styles/globals.css declares every z-index and shadow variable the
 * token module names, with the same value for the z-index ladder, and that
 * it declares no --z-* variable the ladder does not know.
 */
/** Numeric pixel value of a CSS length such as '16px', or null. */
function pixelValue(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match === null ? null : Number(match[1]);
}

/**
 * Typography integrity. The body step is the platform floor: it must exist,
 * it must be at least MINIMUM_BODY_TEXT_PX, the scale must ascend without a
 * repeat, and a line height may never be smaller than its font size.
 */
function checkTypography(reader) {
  const findings = [];
  const sizes = reader.read('FONT_SIZE_TOKENS');
  const requiredKeys = reader.read('REQUIRED_FONT_SIZE_KEYS');
  const minimumBodyPx = reader.read('MINIMUM_BODY_TEXT_PX');
  const weights = reader.read('FONT_WEIGHT_TOKENS');
  const families = reader.read('FONT_FAMILY_TOKENS');

  if (!isPlainObject(sizes)) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'FONT_SIZE_TOKENS was not found',
    });
  } else {
    if (!Array.isArray(requiredKeys)) {
      findings.push({
        file: TOKEN_FILE,
        line: 1,
        column: 1,
        message: 'REQUIRED_FONT_SIZE_KEYS must be a literal array',
      });
    } else {
      for (const key of requiredKeys) {
        if (!Object.prototype.hasOwnProperty.call(sizes, key)) {
          findings.push({
            file: TOKEN_FILE,
            line: 1,
            column: 1,
            message: `the typography scale is missing the ${key} step`,
          });
        }
      }
    }
    if (typeof minimumBodyPx !== 'number' || minimumBodyPx < 16) {
      findings.push({
        file: TOKEN_FILE,
        line: 1,
        column: 1,
        message: 'MINIMUM_BODY_TEXT_PX must be a number of at least 16',
      });
    }

    const entries = Object.entries(sizes);
    let previousSize = 0;
    for (const [key, token] of entries) {
      if (!isPlainObject(token)) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} must be an object literal with size, lineHeight, letterSpacing and usage`,
        });
        continue;
      }
      const size = pixelValue(token.size);
      const lineHeight = pixelValue(token.lineHeight);
      if (size === null) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} must declare a pixel size, found ${JSON.stringify(token.size)}`,
        });
        continue;
      }
      if (lineHeight === null || lineHeight < size) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} (${token.size}) needs a line height of at least its size, found ${JSON.stringify(token.lineHeight)}`,
        });
      }
      if (typeof token.letterSpacing !== 'string' || token.letterSpacing.trim().length === 0) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} must declare letterSpacing`,
        });
      }
      if (typeof token.usage !== 'string' || token.usage.trim().length === 0) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} must document its usage`,
        });
      }
      if (size <= previousSize) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font size ${key} (${token.size}) must be larger than the previous step (${previousSize}px)`,
        });
      }
      previousSize = size;
      if (key === 'base' && typeof minimumBodyPx === 'number' && size < minimumBodyPx) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `the body font size is ${token.size}; it must stay at or above ${minimumBodyPx}px or iOS Safari zooms the viewport on focus`,
        });
      }
    }
  }

  if (!isPlainObject(weights)) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'FONT_WEIGHT_TOKENS was not found',
    });
  } else {
    const expected = { normal: 400, medium: 500, semibold: 600, bold: 700 };
    for (const [key, value] of Object.entries(expected)) {
      if (weights[key] !== value) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `font weight ${key} must be ${value}, found ${JSON.stringify(weights[key])}`,
        });
      }
    }
  }

  if (!isPlainObject(families)) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'FONT_FAMILY_TOKENS was not found',
    });
  } else {
    for (const key of ['sans', 'mono']) {
      const stack = families[key];
      if (!Array.isArray(stack) || stack.length === 0) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `the ${key} font family must be a non-empty stack`,
        });
        continue;
      }
      if (!/^var\(--font-[a-z]+\)$/.test(stack[0])) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `the ${key} font stack must start with its CSS variable so next/font can override it`,
        });
      }
    }
  }

  return findings;
}

/**
 * Motion integrity. Durations must be real millisecond values in ascending
 * order, every one of them must collapse to zero under reduced motion, the
 * easing curves the specification requires must exist, and no two tokens may
 * share a CSS variable.
 */
function checkMotion(reader) {
  const findings = [];
  const durations = reader.read('MOTION_DURATION_TOKENS');
  const requiredDurations = reader.read('REQUIRED_MOTION_DURATION_KEYS');
  const easings = reader.read('MOTION_EASING_TOKENS');
  const requiredEasings = reader.read('REQUIRED_EASING_KEYS');
  const variables = new Map();

  if (!isPlainObject(durations)) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'MOTION_DURATION_TOKENS was not found',
    });
  } else {
    if (Array.isArray(requiredDurations)) {
      for (const key of requiredDurations) {
        if (!Object.prototype.hasOwnProperty.call(durations, key)) {
          findings.push({
            file: TOKEN_FILE,
            line: 1,
            column: 1,
            message: `the motion scale is missing the ${key} duration`,
          });
        }
      }
    } else {
      findings.push({
        file: TOKEN_FILE,
        line: 1,
        column: 1,
        message: 'REQUIRED_MOTION_DURATION_KEYS must be a literal array',
      });
    }
    let previous = -1;
    for (const [key, token] of Object.entries(durations)) {
      if (!isPlainObject(token)) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `motion duration ${key} must be an object literal`,
        });
        continue;
      }
      const milliseconds = /^(\d+)ms$/.exec(String(token.value));
      if (milliseconds === null) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `motion duration ${key} must be a millisecond value, found ${JSON.stringify(token.value)}`,
        });
        continue;
      }
      const amount = Number(milliseconds[1]);
      if (amount < previous) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `motion duration ${key} (${token.value}) must not be shorter than the previous step (${previous}ms)`,
        });
      }
      previous = amount;
      if (token.reducedValue !== '0ms') {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `motion duration ${key} must set reducedValue to 0ms, found ${JSON.stringify(token.reducedValue)}`,
        });
      }
      if (typeof token.variable !== 'string' || !token.variable.startsWith('--duration-')) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `motion duration ${key} needs a --duration-* variable`,
        });
      } else if (variables.has(token.variable)) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `${token.variable} is declared by both ${variables.get(token.variable)} and ${key}`,
        });
      } else {
        variables.set(token.variable, key);
      }
    }
  }

  if (!isPlainObject(easings)) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'MOTION_EASING_TOKENS was not found',
    });
  } else {
    if (Array.isArray(requiredEasings)) {
      for (const key of requiredEasings) {
        if (!Object.prototype.hasOwnProperty.call(easings, key)) {
          findings.push({
            file: TOKEN_FILE,
            line: 1,
            column: 1,
            message: `the motion scale is missing the ${key} easing curve`,
          });
        }
      }
    }
    for (const [key, token] of Object.entries(easings)) {
      if (
        !isPlainObject(token) ||
        typeof token.value !== 'string' ||
        token.value.trim().length === 0
      ) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `easing ${key} must declare a value`,
        });
        continue;
      }
      if (!/^(cubic-bezier\([^)]+\)|linear|ease(-in-out|-in|-out)?)$/.test(token.value.trim())) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `easing ${key} must be a cubic-bezier curve, linear or a named easing, found ${JSON.stringify(token.value)}`,
        });
      }
      if (typeof token.variable !== 'string' || !token.variable.startsWith('--ease-')) {
        findings.push({
          file: TOKEN_FILE,
          line: 1,
          column: 1,
          message: `easing ${key} needs an --ease-* variable`,
        });
      }
    }
  }

  return findings;
}

/**
 * Stylesheet sync. Every variable the token module requires must exist in the
 * :root block of styles/globals.css with the same value, the z-index ladder
 * must repeat in .dark, no ladder or shadow variable may appear that the
 * token module does not define, and the reduced motion and forced colors
 * blocks must contain the rules that make them real.
 */
function checkStylesheetVariables() {
  const findings = [];
  const text = safeRead(STYLESHEET);
  if (text === null) {
    return [{ file: STYLESHEET, line: 1, column: 1, message: 'the global stylesheet is missing' }];
  }
  const records = parseCssDeclarations(text);
  const root = selectCssBlock(records, { selector: ':root' });
  if (root.size === 0) {
    return [{ file: STYLESHEET, line: 1, column: 1, message: 'the :root block was not found' }];
  }

  const expectations = cssVariableExpectations();
  for (const [name, value] of Object.entries(expectations)) {
    const declared = root.get(name);
    if (declared === undefined) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `missing CSS variable ${name} required by ${TOKEN_FILE}`,
      });
      continue;
    }
    if (value !== 'defined' && declared !== value) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is ${declared} but the token module declares ${value}`,
      });
    }
  }

  const dark = selectCssBlock(records, { selector: '.dark' });
  for (const [name, value] of dark.entries()) {
    if (name.startsWith('--z-') && root.get(name) !== value) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is ${value} in .dark but ${root.get(name)} in :root; the z-index ladder is not theme dependent`,
      });
    }
  }

  const knownLadder = new Set(Object.keys(expectations).filter((name) => name.startsWith('--z-')));
  const knownShadow = new Set(
    Object.keys(expectations).filter((name) => name.startsWith('--shadow-')),
  );
  for (const name of root.keys()) {
    if (name.startsWith('--z-') && !knownLadder.has(name)) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is not a layer of the z-index ladder in ${TOKEN_FILE}`,
      });
    }
    if (name.startsWith('--shadow-') && name !== '--shadow-color' && !knownShadow.has(name)) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is not a step of the shadow scale in ${TOKEN_FILE}`,
      });
    }
  }

  findings.push(...checkReducedMotion(records));
  findings.push(...checkForcedColors(records));
  return findings;
}

/**
 * Reduced motion must zero every duration variable and stop repeating
 * animations. The interface keeps its layout and information; only movement
 * disappears.
 */
function checkReducedMotion(records) {
  const findings = [];
  const reduced = selectCssBlock(records, {
    selector: ':root',
    media: 'prefers-reduced-motion: reduce',
  });
  if (reduced.size === 0) {
    findings.push({
      file: STYLESHEET,
      line: 1,
      column: 1,
      message: 'the reduced motion block @media (prefers-reduced-motion: reduce) is missing',
    });
    return findings;
  }

  const reader = createTokenReader();
  const durations = reader.read('MOTION_DURATION_TOKENS');
  if (isPlainObject(durations)) {
    for (const [key, token] of Object.entries(durations)) {
      if (!isPlainObject(token) || typeof token.variable !== 'string') {
        continue;
      }
      const declared = reduced.get(token.variable);
      if (declared !== token.reducedValue) {
        findings.push({
          file: STYLESHEET,
          line: 1,
          column: 1,
          message: `reduced motion must set ${token.variable} (${key}) to ${token.reducedValue}, found ${JSON.stringify(declared)}`,
        });
      }
    }
  }

  const collapse = selectCssBlock(records, {
    selector: '*, *::before, *::after',
    media: 'prefers-reduced-motion: reduce',
  });
  const required = {
    'animation-duration': '0.01ms !important',
    'animation-iteration-count': '1 !important',
    'transition-duration': '0.01ms !important',
    'scroll-behavior': 'auto !important',
  };
  if (collapse.size === 0) {
    findings.push({
      file: STYLESHEET,
      line: 1,
      column: 1,
      message: 'the reduced motion block must collapse animation and transition durations',
    });
    return findings;
  }
  for (const [property, value] of Object.entries(required)) {
    if (collapse.get(property) !== value) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `reduced motion must declare ${property}: ${value}, found ${JSON.stringify(collapse.get(property))}`,
      });
    }
  }
  return findings;
}

/**
 * Forced colors: the operating system replaces the palette, so the stylesheet
 * must restore structure with system colors. Borders keep the shape of a
 * control and the focus ring stays visible, which is the whole point of the
 * block.
 */
function checkForcedColors(records) {
  const findings = [];
  const border = selectCssBlock(records, {
    selector: '*, *::before, *::after',
    media: 'forced-colors: active',
  });
  if (border.get('border-color') !== 'CanvasText') {
    findings.push({
      file: STYLESHEET,
      line: 1,
      column: 1,
      message: 'the forced colors block must set border-color: CanvasText',
    });
  }
  const focus = selectCssBlock(records, {
    selector: ':focus-visible',
    media: 'forced-colors: active',
  });
  if (focus.get('outline-color') !== 'Highlight') {
    findings.push({
      file: STYLESHEET,
      line: 1,
      column: 1,
      message:
        'the forced colors block must keep the focus ring visible with outline-color: Highlight',
    });
  }
  return findings;
}

/** Every CSS variable the token module requires, name to value. */
function cssVariableExpectations() {
  const reader = createTokenReader();
  if (reader.sourceFile === null) {
    return {};
  }
  const result = {};

  const ladder = reader.read('Z_INDEX_TOKENS');
  if (isPlainObject(ladder)) {
    for (const token of Object.values(ladder)) {
      if (
        isPlainObject(token) &&
        typeof token.variable === 'string' &&
        typeof token.value === 'number'
      ) {
        result[token.variable] = String(token.value);
      }
    }
  }

  const shadows = reader.read('SHADOW_TOKENS');
  if (isPlainObject(shadows)) {
    for (const token of Object.values(shadows)) {
      if (!isPlainObject(token) || typeof token.value !== 'string') {
        continue;
      }
      const match = /^var\((--[a-z0-9-]+)\)$/.exec(token.value);
      if (match !== null) {
        result[match[1]] = 'defined';
      }
    }
  }

  for (const group of ['MOTION_DURATION_TOKENS', 'MOTION_EASING_TOKENS']) {
    const tokens = reader.read(group);
    if (!isPlainObject(tokens)) {
      continue;
    }
    for (const token of Object.values(tokens)) {
      if (
        isPlainObject(token) &&
        typeof token.variable === 'string' &&
        typeof token.value === 'string'
      ) {
        result[token.variable] = token.value;
      }
    }
  }

  const families = reader.read('FONT_FAMILY_TOKENS');
  if (isPlainObject(families)) {
    for (const stack of Object.values(families)) {
      if (!Array.isArray(stack)) {
        continue;
      }
      for (const entry of stack) {
        const match = typeof entry === 'string' ? /^var\((--font-[a-z0-9-]+)\)$/.exec(entry) : null;
        if (match !== null) {
          result[match[1]] = 'defined';
        }
      }
    }
  }

  return result;
}

/**
 * The token module must always be imported with its .ts extension.
 *
 * When the import specifier has no extension, the loader that evaluates the
 * file resolves it against every sibling of config/design-tokens.ts. The
 * generated config/design-tokens.json is such a sibling, so an extensionless
 * import can silently bind to the export instead of the module: every named
 * import becomes undefined and Tailwind falls back to its default scales
 * without an error. This rule makes that failure impossible to commit.
 */
function checkTokenImports(files) {
  const findings = [];
  const pattern = /from\s+['"]([^'"]*design-tokens)['"]/g;
  for (const file of files) {
    if (file === SELF || !CODE_EXTENSIONS.some((extension) => file.endsWith(extension))) {
      continue;
    }
    const text = safeRead(file);
    if (text === null) {
      continue;
    }
    pattern.lastIndex = 0;
    let match = pattern.exec(text);
    while (match !== null) {
      const { line, column } = positionOf(text, match.index);
      findings.push({
        file,
        line,
        column,
        message: `import "${match[1]}" must end in .ts: an extensionless specifier can resolve to the generated config/design-tokens.json instead of the token module`,
      });
      match = pattern.exec(text);
    }
  }
  return findings;
}

/** One finding per location and message, so a rule cannot report twice. */
function dedupeFindings(findings) {
  const seen = new Set();
  const unique = [];
  for (const finding of findings) {
    const key = `${finding.file}:${finding.line}:${finding.column}:${finding.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    unique.push(finding);
  }
  return unique;
}

function main() {
  const files = listTrackedFiles();
  const findings = [];
  let scannedSources = 0;
  let classLists = 0;

  const tokenText = safeRead(TOKEN_FILE);
  if (tokenText === null) {
    findings.push({
      file: TOKEN_FILE,
      line: 1,
      column: 1,
      message: 'the design token module is missing',
    });
  } else {
    findings.push(...checkTokenSource(TOKEN_FILE, tokenText));
  }

  findings.push(...checkStylesheetVariables());
  findings.push(...checkTokenImports(files));
  findings.push(...checkTypography(createTokenReader()));
  findings.push(...checkMotion(createTokenReader()));

  const configText = safeRead(TAILWIND_CONFIG);
  if (configText === null) {
    findings.push({
      file: TAILWIND_CONFIG,
      line: 1,
      column: 1,
      message: 'the Tailwind configuration is missing',
    });
  } else {
    findings.push(...checkTailwindConfig(TAILWIND_CONFIG, configText));
  }

  for (const file of files) {
    if (VALUE_ALLOWLIST.includes(file)) {
      continue;
    }
    if (!CODE_EXTENSIONS.some((extension) => file.endsWith(extension))) {
      continue;
    }
    const inScanRoot = SCAN_ROOTS.some((root) => file.startsWith(root));
    const text = safeRead(file);
    if (text === null) {
      continue;
    }
    scannedSources += 1;
    if (!inScanRoot) {
      continue;
    }
    const sourceFile = parseSource(file, text);
    classLists += collectClassStrings(sourceFile).length;
    findings.push(...checkArbitraryValues(file, text));
    findings.push(...checkRawValues(file, text));
    findings.push(...checkInlineStyles(file, text));
  }

  const unique = dedupeFindings(findings);
  const summary = `${scannedSources} source files scanned, ${classLists} class lists checked, spacing/radius/shadow/z-index/typography/motion scales wired from ${TOKEN_FILE} with reduced motion and forced colors verified`;
  reportResult('design-tokens', unique, summary);
}

main();
