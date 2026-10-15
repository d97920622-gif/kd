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
 *    through a CSS variable (var(--...)) or that define one (--name: ...)
 *    are allowed, because they consume the token system rather than bypass
 *    it.
 *
 * 4. No raw color or spacing literals in application code: hex colors,
 *    rgb()/hsl() literals and inline style values are rejected outside the
 *    three files that define tokens (styles/globals.css,
 *    config/design-tokens.ts, tailwind.config.ts).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import { listTrackedFiles, positionOf, reportResult, REPO_ROOT } from './_lib.mjs';

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
  const importsTokenModule = sourceFile.statements.some(
    (statement) =>
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === './config/design-tokens',
  );
  if (!importsTokenModule) {
    findings.push({
      file,
      line: 1,
      column: 1,
      message: 'tailwind.config.ts must import its scales from ./config/design-tokens',
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

/** Bracket values that consume the token system instead of bypassing it. */
function isAllowedBracketValue(inner) {
  const trimmed = inner.trim();
  if (trimmed.startsWith('--')) {
    return true;
  }
  return trimmed.includes('var(--');
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
      if (!isAllowedBracketValue(inner)) {
        const offset = entry.start + findOffsetInRaw(entry, match[0]);
        const { line, column } = positionOf(text, offset);
        findings.push({
          file,
          line,
          column,
          message: `arbitrary Tailwind value [${inner}] is not a token; add a token to config/design-tokens.ts`,
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
function checkStylesheetVariables() {
  const findings = [];
  const text = safeRead(STYLESHEET);
  if (text === null) {
    return [{ file: STYLESHEET, line: 1, column: 1, message: 'the global stylesheet is missing' }];
  }
  const declared = new Map();
  const declarationPattern = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  let match = declarationPattern.exec(text);
  while (match !== null) {
    declared.set(match[1], match[2].trim());
    match = declarationPattern.exec(text);
  }
  const zIndexVariables = [...declared.entries()].filter(([name]) => name.startsWith('--z-'));
  const shadowVariables = [...declared.entries()].filter(([name]) => name.startsWith('--shadow-'));

  // Light and dark blocks may declare a variable twice; compare the first
  // declaration, which is the light theme used by tokens for structure.
  const firstDeclaration = new Map();
  for (const [name, value] of declared.entries()) {
    if (!firstDeclaration.has(name)) {
      firstDeclaration.set(name, value);
    }
  }

  for (const [name, value] of Object.entries(cssVariableExpectations())) {
    if (!declared.has(name)) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `missing CSS variable ${name} required by config/design-tokens.ts`,
      });
      continue;
    }
    if (value !== 'defined' && firstDeclaration.get(name) !== value) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is ${firstDeclaration.get(name)} but the token ladder declares ${value}`,
      });
    }
  }

  const knownZIndex = new Set(
    Object.keys(cssVariableExpectations()).filter((name) => name.startsWith('--z-')),
  );
  for (const [name] of zIndexVariables) {
    if (!knownZIndex.has(name)) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is not a token from the z-index ladder`,
      });
    }
  }

  const knownShadows = new Set(['--shadow-color']);
  for (const [name] of shadowVariables) {
    if (
      !knownShadows.has(name) &&
      !Object.prototype.hasOwnProperty.call(cssVariableExpectations(), name)
    ) {
      findings.push({
        file: STYLESHEET,
        line: 1,
        column: 1,
        message: `${name} is not a token from the shadow scale`,
      });
    }
  }
  return findings;
}

/** Read REQUIRED_CSS_VARIABLES out of the token module source. */
function cssVariableExpectations() {
  const text = safeRead(TOKEN_FILE);
  if (text === null) {
    return {};
  }
  const sourceFile = parseSource(TOKEN_FILE, text);
  const result = {};
  const visit = (node) => {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === 'Z_INDEX_TOKENS') {
          const initializer = unwrap(declaration.initializer);
          if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
            for (const property of initializer.properties) {
              if (!ts.isPropertyAssignment(property)) {
                continue;
              }
              const entry = unwrap(property.initializer);
              if (entry === undefined || !ts.isObjectLiteralExpression(entry)) {
                continue;
              }
              const variable = readObjectField(entry, 'variable');
              const value = readObjectField(entry, 'value');
              if (typeof variable === 'string' && typeof value === 'number') {
                result[variable] = String(value);
              }
            }
          }
        }
        if (ts.isIdentifier(declaration.name) && declaration.name.text === 'SHADOW_TOKENS') {
          const initializer = unwrap(declaration.initializer);
          if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
            for (const property of initializer.properties) {
              if (!ts.isPropertyAssignment(property)) {
                continue;
              }
              const entry = unwrap(property.initializer);
              if (entry === undefined || !ts.isObjectLiteralExpression(entry)) {
                continue;
              }
              const value = readObjectField(entry, 'value');
              if (typeof value === 'string') {
                const match = /^var\((--[a-z0-9-]+)\)$/.exec(value);
                if (match !== null) {
                  result[match[1]] = 'defined';
                }
              }
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return result;
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
  const summary = `${scannedSources} source files scanned, ${classLists} class lists checked, spacing/radius/shadow/z-index scales wired from ${TOKEN_FILE}`;
  reportResult('design-tokens', unique, summary);
}

main();
