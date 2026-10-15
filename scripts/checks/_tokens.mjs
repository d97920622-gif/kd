// path: scripts/checks/_tokens.mjs
/**
 * Shared reader for config/design-tokens.ts.
 *
 * The token module is the single source of truth for every scale, theme and
 * contrast pair, but it is TypeScript and the checks are plain Node scripts.
 * This reader parses it with the TypeScript compiler API and evaluates the
 * literal initializers, so a check can assert on token values without a build
 * step and without importing the module.
 *
 * Only literal expressions are evaluated: strings, numbers, booleans, arrays
 * and object literals. An initializer that needs a computation (a spread, a
 * function call, a referenced identifier) evaluates to undefined, and the
 * caller treats that as a missing token rather than guessing.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import { REPO_ROOT } from './_lib.mjs';

/** Path of the token module relative to the repository root. */
export const TOKEN_FILE = 'config/design-tokens.ts';

/** Read and parse the token module once. */
export function createTokenReader(file = TOKEN_FILE) {
  let text = '';
  try {
    text = readFileSync(join(REPO_ROOT, file), 'utf8');
  } catch {
    return { file, text: '', sourceFile: null, read: () => undefined };
  }
  const sourceFile = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS,
  );
  const declarations = collectTopLevelDeclarations(sourceFile);
  return {
    file,
    text,
    sourceFile,
    read(name) {
      const initializer = declarations.get(name);
      if (initializer === undefined) {
        return undefined;
      }
      return evaluate(initializer);
    },
  };
}

function collectTopLevelDeclarations(sourceFile) {
  const declarations = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.initializer !== undefined) {
        declarations.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  return declarations;
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

/** Evaluate a literal expression to a plain JavaScript value. */
export function evaluate(node) {
  const value = unwrap(node);
  if (value === undefined) {
    return undefined;
  }
  if (ts.isStringLiteral(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
    return value.text;
  }
  if (ts.isNumericLiteral(value)) {
    return Number(value.text);
  }
  if (ts.isPrefixUnaryExpression(value) && ts.isNumericLiteral(value.operand)) {
    const magnitude = Number(value.operand.text);
    return value.operator === ts.SyntaxKind.MinusToken ? -magnitude : magnitude;
  }
  if (value.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (value.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (ts.isArrayLiteralExpression(value)) {
    const items = [];
    for (const element of value.elements) {
      const evaluated = evaluate(element);
      if (evaluated === undefined) {
        return undefined;
      }
      items.push(evaluated);
    }
    return items;
  }
  if (ts.isObjectLiteralExpression(value)) {
    const result = {};
    for (const property of value.properties) {
      if (!ts.isPropertyAssignment(property)) {
        return undefined;
      }
      const key = propertyKey(property.name);
      if (key === null) {
        return undefined;
      }
      const evaluated = evaluate(property.initializer);
      if (evaluated === undefined) {
        return undefined;
      }
      result[key] = evaluated;
    }
    return result;
  }
  return undefined;
}

function propertyKey(nameNode) {
  if (ts.isIdentifier(nameNode)) {
    return nameNode.text;
  }
  if (ts.isStringLiteral(nameNode) || ts.isNumericLiteral(nameNode)) {
    return nameNode.text;
  }
  return null;
}

/**
 * True when a value is a plain object with the expected keys and no
 * inherited surprises. Checks use it before reading nested token maps.
 */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
