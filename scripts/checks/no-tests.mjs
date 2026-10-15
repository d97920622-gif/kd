// path: scripts/checks/no-tests.mjs
/**
 * check:no-tests -- Rule 4 enforcement: this project ships no test files.
 *
 * Fails when a tracked path looks like a test artefact (test file name,
 * test directory, runner configuration) or when package.json declares a
 * test framework dependency or runs one from a script.
 */
import { listTrackedFiles, matchesAny, readTextFile, reportResult } from './_lib.mjs';

const TEST_PATH_PATTERNS = [
  /\.test\.[cm]?[jt]sx?$/,
  /\.spec\.[cm]?[jt]sx?$/,
  /(^|\/)__tests__\//,
  /(^|\/)__mocks__\//,
  /(^|\/)(test|tests)\//,
  /(^|\/)(e2e|cypress|playwright)\//,
  /(^|\/)(jest|vitest|playwright|cypress)\.[a-z]+\.(js|ts|mjs|cjs|json)$/,
];

const FORBIDDEN_DEPENDENCY_PATTERN =
  /^(jest|jest-|vitest|mocha|jasmine|cypress|playwright|@playwright\/|puppeteer|karma|ava|chai|sinon|testcafe|webdriverio|enzyme|@testing-library\/)/;

const FORBIDDEN_SCRIPT_PATTERN =
  /\b(jest|vitest|mocha|jasmine|cypress|playwright|karma|ava|testcafe)\b/;

function findPathFindings(files) {
  const findings = [];
  for (const file of files) {
    if (matchesAny(file, TEST_PATH_PATTERNS)) {
      findings.push({
        file,
        line: 1,
        column: 1,
        message: 'test artefacts are excluded from this project (Rule 4)',
      });
    }
  }
  return findings;
}

function findPackageFindings() {
  const text = readTextFile('package.json');
  if (text === null) {
    return [];
  }
  const findings = [];
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch {
    return findings;
  }
  const sections = [manifest.dependencies, manifest.devDependencies, manifest.peerDependencies];
  for (const section of sections) {
    if (section === undefined || section === null) {
      continue;
    }
    for (const name of Object.keys(section)) {
      if (FORBIDDEN_DEPENDENCY_PATTERN.test(name)) {
        findings.push({
          file: 'package.json',
          line: 1,
          column: 1,
          message: `test framework dependency "${name}" is excluded from this project (Rule 4)`,
        });
      }
    }
  }
  for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
    if (typeof command === 'string' && FORBIDDEN_SCRIPT_PATTERN.test(command)) {
      findings.push({
        file: 'package.json',
        line: 1,
        column: 1,
        message: `script "${name}" invokes a test framework, which is excluded (Rule 4)`,
      });
    }
  }
  return findings;
}

function main() {
  const files = listTrackedFiles();
  const findings = [...findPathFindings(files), ...findPackageFindings()];
  reportResult('no-tests', findings, `${files.length} tracked files inspected`);
}

main();
