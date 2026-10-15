// path: scripts/verify.mjs
/**
 * npm run verify -- the single aggregated quality gate for the platform.
 *
 * The runner executes every tool and every check script in a fixed order,
 * prints one PASS or FAIL line per entry with a short result summary and the
 * duration, prints the captured output for failures, and exits with code 0
 * only when everything passed. The exit code contract makes the command
 * usable unchanged in a pre-commit hook and in CI.
 *
 * Commands in order:
 *   1. typecheck        tsc --noEmit
 *   2. lint             eslint --max-warnings=0
 *   3. format:check     prettier --check .
 *   4. env:validate     environment schema against the current environment
 *   5..17               the thirteen rule checks in scripts/checks
 *
 * The production build and the Lighthouse run are step gates, not part of
 * verify; they are executed separately and recorded in the step handoff.
 */
import { execFileSync, spawnSync } from 'node:child_process';

const ENTRIES = [
  { name: 'typecheck', command: 'npx', args: ['tsc', '--noEmit'] },
  {
    name: 'lint',
    command: 'npx',
    args: ['eslint', '.', '--ext', '.js,.jsx,.ts,.tsx,.mjs', '--max-warnings=0'],
  },
  { name: 'format:check', command: 'npx', args: ['prettier', '--check', '.'] },
  {
    name: 'env:validate',
    command: 'npx',
    args: ['tsx', '--env-file-if-exists=.env', 'lib/env/cli.ts'],
  },
  { name: 'check:english-only', command: 'node', args: ['scripts/checks/english-only.mjs'] },
  { name: 'check:no-todo', command: 'node', args: ['scripts/checks/no-todo.mjs'] },
  { name: 'check:no-coming-soon', command: 'node', args: ['scripts/checks/no-coming-soon.mjs'] },
  { name: 'check:no-tests', command: 'node', args: ['scripts/checks/no-tests.mjs'] },
  { name: 'check:path-comment', command: 'node', args: ['scripts/checks/path-comment.mjs'] },
  { name: 'check:i18n-strings', command: 'node', args: ['scripts/checks/i18n-strings.mjs'] },
  { name: 'check:no-console', command: 'node', args: ['scripts/checks/no-console.mjs'] },
  {
    name: 'check:forbidden-brands',
    command: 'node',
    args: ['scripts/checks/forbidden-brands.mjs'],
  },
  { name: 'check:migration-pairs', command: 'node', args: ['scripts/checks/migration-pairs.mjs'] },
  { name: 'check:dead-links', command: 'node', args: ['scripts/checks/dead-links.mjs'] },
  { name: 'check:secrets', command: 'node', args: ['scripts/checks/secrets.mjs'] },
  { name: 'check:any-types', command: 'node', args: ['scripts/checks/any-types.mjs'] },
  { name: 'check:money-math', command: 'node', args: ['scripts/checks/money-math.mjs'] },
];

const SUMMARY_PATTERN = /(PASS \(|FAIL \(|code style|All matched files)/i;

function gitLine(args, fallback) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim();
  } catch {
    return fallback;
  }
}

function nonEmptyLines(output) {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Prefer a meaningful result line over tool noise and environment notes. */
function summaryFor(result) {
  const stdoutLines = nonEmptyLines(result.stdout);
  const stderrLines = nonEmptyLines(result.stderr);
  const marked = stdoutLines.filter((line) => SUMMARY_PATTERN.test(line));
  if (marked.length > 0) {
    return marked[marked.length - 1];
  }
  if (stdoutLines.length > 0) {
    return stdoutLines[stdoutLines.length - 1];
  }
  if (stderrLines.length > 0 && !result.passed) {
    return stderrLines[stderrLines.length - 1];
  }
  return 'completed with no output';
}

function runEntry(entry) {
  const started = process.hrtime.bigint();
  const result = spawnSync(entry.command, entry.args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
  return {
    passed: result.status === 0,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    durationMs,
  };
}

function printHeader() {
  const branch = gitLine(['branch', '--show-current'], 'unknown');
  const commit = gitLine(['rev-parse', '--short', 'HEAD'], 'uncommitted');
  process.stdout.write('== KD SOLUTION IT verify ==\n');
  process.stdout.write(`branch ${branch} at ${commit}\n`);
}

function printFailureDetail(result) {
  for (const line of [...nonEmptyLines(result.stdout), ...nonEmptyLines(result.stderr)]) {
    process.stdout.write(`     | ${line}\n`);
  }
}

function main() {
  printHeader();
  const failures = [];
  for (const entry of ENTRIES) {
    const result = runEntry(entry);
    const status = result.passed ? 'PASS' : 'FAIL';
    const seconds = (result.durationMs / 1000).toFixed(1).padStart(5);
    process.stdout.write(
      `${status} ${entry.name.padEnd(24)} ${summaryFor(result)} (${seconds}s)\n`,
    );
    if (!result.passed) {
      failures.push(entry.name);
      printFailureDetail(result);
    }
  }
  const totalChecks = ENTRIES.length;
  const passedCount = totalChecks - failures.length;
  if (failures.length === 0) {
    process.stdout.write(`RESULT: PASS (${passedCount} of ${totalChecks} checks passed)\n`);
    return;
  }
  process.stdout.write(`RESULT: FAIL (${failures.length} of ${totalChecks} checks failed)\n`);
  process.stdout.write(`Failed: ${failures.join(', ')}\n`);
  process.exitCode = 1;
}

main();
