// path: scripts/checks/i18n-strings.mjs
/**
 * check:i18n-strings -- Rule 1 enforcement for display text and catalogue
 * health.
 *
 * Two jobs:
 *
 * 1. Hardcoded display text. Every .tsx file under app/ or components/ is
 *    parsed with the TypeScript compiler API, so only real JSX text nodes
 *    and real display attributes are inspected. Comparison operators,
 *    comments, CSS class names, data attributes and test ids are never
 *    flagged, which keeps the check free of false positives.
 *
 * 2. Catalogue health for lib/i18n/strings/en.ts and its namespace files:
 *    every leaf is a string, every key segment is lower case snake case,
 *    no duplicate keys, no empty or whitespace-padded values, placeholders
 *    are lower case snake case, and every plural pair has both members.
 *
 *    A plural pair is recognised by the {count} placeholder, not by the
 *    suffix alone: a key that ends in _other for another reason (for example
 *    date_before_other) is not treated as a plural form.
 *
 * Exemptions: none for application UI. The catalogue itself is exempt from
 * the display text scan because its strings are the catalogue.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import { listTrackedFiles, positionOf, reportResult, REPO_ROOT } from './_lib.mjs';

const SCAN_ROOTS = ['app/', 'components/'];
const CATALOGUE_DIRECTORY = 'lib/i18n/strings/';
const CATALOGUE_ENTRY = 'lib/i18n/strings/en.ts';

const DISPLAY_ATTRIBUTES = new Set([
  'alt',
  'title',
  'placeholder',
  'label',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'aria-valuetext',
]);

const KEY_SEGMENT_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

/**
 * Strip the type-level wrappers a catalogue object can carry, so an
 * "as const" or "satisfies" annotation does not hide the literal from the
 * checker.
 */
function unwrapExpression(node) {
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
const PLACEHOLDER_PATTERN = /\{([^{}]*)\}/g;
const MIN_LETTERS_IN_TEXT = 2;
const LETTER_PATTERN = /[A-Za-z]/;

function parseSource(file, text) {
  return ts.createSourceFile(file, text, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
}

function lineColumnOf(sourceFile, text, node) {
  const start = node.getStart(sourceFile);
  return positionOf(text, start);
}

function hasEnoughLetters(text) {
  const letters = text.match(/[A-Za-z]/g);
  return letters !== null && letters.length >= MIN_LETTERS_IN_TEXT;
}

/** True when the literal is allowed: punctuation, symbols, numbers, entities. */
function isAllowedLiteral(raw) {
  const collapsed = raw.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) {
    return true;
  }
  if (!LETTER_PATTERN.test(collapsed)) {
    return true;
  }
  if (collapsed.startsWith('&') && collapsed.endsWith(';')) {
    return true;
  }
  return !hasEnoughLetters(collapsed);
}

function isDisplayAttribute(name) {
  return DISPLAY_ATTRIBUTES.has(name.toLowerCase());
}

function scanTsxFile(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);
  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const raw = node.getText(sourceFile);
      if (!isAllowedLiteral(raw)) {
        const { line, column } = lineColumnOf(sourceFile, text, node);
        findings.push({
          file,
          line,
          column,
          message: `hardcoded display text "${raw.trim().slice(0, 40)}"; use a catalogue key with t()`,
        });
      }
    }
    if (ts.isJsxAttribute(node) && node.initializer !== undefined) {
      const name = node.name.getText(sourceFile);
      if (isDisplayAttribute(name) && ts.isStringLiteral(node.initializer)) {
        const value = node.initializer.text;
        if (!isAllowedLiteral(value)) {
          const { line, column } = lineColumnOf(sourceFile, text, node);
          findings.push({
            file,
            line,
            column,
            message: `hardcoded string in the ${name} attribute; pass t('...') instead`,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

function propertyNameOf(node, sourceFile) {
  if (node.name === undefined) {
    return null;
  }
  if (
    ts.isIdentifier(node.name) ||
    ts.isStringLiteral(node.name) ||
    ts.isNumericLiteral(node.name)
  ) {
    return { name: node.name.getText(sourceFile).replace(/^["']|["']$/g, ''), node: node.name };
  }
  return null;
}

function isNonEmptyStringLiteral(node) {
  return (
    (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && node.text.length > 0
  );
}

/** Walk the catalogue literal and report every health problem found. */
function scanCatalogueFile(file, text) {
  const findings = [];
  const sourceFile = parseSource(file, text);
  const visitObject = (node, depth, path, seenKeys) => {
    if (depth > 3) {
      const { line, column } = lineColumnOf(sourceFile, text, node);
      findings.push({
        file,
        line,
        column,
        message: 'string key nesting is deeper than three levels',
      });
      return;
    }
    for (const property of node.properties) {
      const named = propertyNameOf(property, sourceFile);
      if (named === null) {
        const { line, column } = lineColumnOf(sourceFile, text, property);
        findings.push({
          file,
          line,
          column,
          message: 'catalogue entries must be plain key names with string values',
        });
        continue;
      }
      const segment = named.name;
      const fullPath = path.length === 0 ? segment : `${path}.${segment}`;
      const { line, column } = positionOf(text, named.node.getStart(sourceFile));
      if (!KEY_SEGMENT_PATTERN.test(segment)) {
        findings.push({
          file,
          line,
          column,
          message: `key segment "${segment}" must be lower case snake case`,
        });
      }
      if (seenKeys.has(segment)) {
        findings.push({
          file,
          line,
          column,
          message: `duplicate key "${segment}" in the same object`,
        });
      }
      seenKeys.add(segment);
      const initializer = unwrapExpression(property.initializer);
      if (initializer === undefined) {
        continue;
      }
      if (ts.isObjectLiteralExpression(initializer)) {
        visitObject(initializer, depth + 1, fullPath, new Set());
        continue;
      }
      if (!isNonEmptyStringLiteral(initializer)) {
        findings.push({
          file,
          line,
          column,
          message: `value for "${fullPath}" must be a non-empty string literal`,
        });
        continue;
      }
      const value = initializer.text;
      checkValue(file, text, initializer, fullPath, value, findings);
    }
  };

  const visit = (node) => {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        const initializer = unwrapExpression(declaration.initializer);
        if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
          visitObject(initializer, 1, '', new Set());
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return findings;
}

function checkValue(file, text, literalNode, fullPath, value, findings) {
  const reported = (message) => {
    const { line, column } = positionOf(text, literalNode.getStart());
    findings.push({ file, line, column, message: `${fullPath}: ${message}` });
  };
  if (value.trim().length === 0) {
    reported('value is empty or only whitespace');
    return;
  }
  if (value !== value.trim()) {
    reported('value has leading or trailing whitespace');
  }
  if (value.includes('  ')) {
    reported('value contains a double space');
  }
  // ASCII only; the English-only check covers the file, this covers the value.
  for (const char of value) {
    if (char.codePointAt(0) > 127) {
      reported('value contains a non-ASCII character');
      break;
    }
  }
  PLACEHOLDER_PATTERN.lastIndex = 0;
  let match = PLACEHOLDER_PATTERN.exec(value);
  while (match !== null) {
    if (!KEY_SEGMENT_PATTERN.test(match[1])) {
      reported(`placeholder "{${match[1]}}" must be lower case snake case`);
    }
    match = PLACEHOLDER_PATTERN.exec(value);
  }
}

/**
 * Plural pairs: a key whose value interpolates {count} and ends in _one or
 * _other must have its counterpart. Keys that end in _other for another
 * reason carry no {count} and are left alone.
 */
function checkPluralPairs(leaves) {
  const findings = [];
  const plural = leaves.filter((leaf) => leaf.hasCountPlaceholder);
  for (const leaf of plural) {
    if (
      leaf.path.endsWith('_one') &&
      !plural.some((other) => other.path === `${leaf.path.slice(0, -4)}_other`)
    ) {
      findings.push({
        file: leaf.file,
        line: leaf.line,
        column: leaf.column,
        message: `${leaf.path}: plural pair is missing the _other form`,
      });
    }
    if (
      leaf.path.endsWith('_other') &&
      !plural.some((other) => other.path === `${leaf.path.slice(0, -6)}_one`)
    ) {
      findings.push({
        file: leaf.file,
        line: leaf.line,
        column: leaf.column,
        message: `${leaf.path}: plural pair is missing the _one form`,
      });
    }
  }
  return findings;
}

function collectLeaves(file, text) {
  const sourceFile = parseSource(file, text);
  const leaves = [];
  const walk = (node, path) => {
    for (const property of node.properties) {
      const named = propertyNameOf(property, sourceFile);
      const initializer = unwrapExpression(property.initializer);
      if (named === null || initializer === undefined) {
        continue;
      }
      const fullPath = path.length === 0 ? named.name : `${path}.${named.name}`;
      if (ts.isObjectLiteralExpression(initializer)) {
        walk(initializer, fullPath);
        continue;
      }
      if (isNonEmptyStringLiteral(initializer)) {
        const { line, column } = positionOf(text, initializer.getStart(sourceFile));
        leaves.push({
          path: fullPath,
          file,
          line,
          column,
          hasCountPlaceholder: initializer.text.includes('{count}'),
        });
      }
    }
  };
  const visit = (node) => {
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        const initializer = unwrapExpression(declaration.initializer);
        if (initializer !== undefined && ts.isObjectLiteralExpression(initializer)) {
          walk(initializer, '');
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return leaves;
}

function safeRead(file) {
  try {
    return readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return null;
  }
}

function main() {
  const files = listTrackedFiles();
  const findings = [];
  let tsxCount = 0;
  let catalogueCount = 0;
  const leaves = [];

  for (const file of files) {
    if (file.endsWith('.tsx') && SCAN_ROOTS.some((root) => file.startsWith(root))) {
      const text = safeRead(file);
      if (text === null) {
        continue;
      }
      tsxCount += 1;
      findings.push(...scanTsxFile(file, text));
      continue;
    }
    if (file.startsWith(CATALOGUE_DIRECTORY) && file.endsWith('.ts') && file !== CATALOGUE_ENTRY) {
      const text = safeRead(file);
      if (text === null) {
        continue;
      }
      catalogueCount += 1;
      findings.push(...scanCatalogueFile(file, text));
      leaves.push(...collectLeaves(file, text));
    }
  }

  findings.push(...checkPluralPairs(leaves));

  // A silent no-op would look like a pass. The catalogue must exist and must
  // hold keys, so the check fails when it finds nothing to validate.
  if (catalogueCount === 0 || leaves.length === 0) {
    findings.push({
      file: CATALOGUE_DIRECTORY,
      line: 1,
      column: 1,
      message: 'no catalogue namespace files were found to validate',
    });
  }

  const summary = `${tsxCount} JSX files checked for literal copy, ${catalogueCount} catalogue namespaces with ${leaves.length} keys validated`;
  reportResult('i18n-strings', findings, summary);
}

main();
