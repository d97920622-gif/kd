// path: lib/env/cli.ts
import {
  ENV_SOURCE_KEYS,
  EnvValidationError,
  type EnvKey,
  getEnv,
  maskValue,
  SECRET_ENV_KEYS,
} from './validate-env';

/**
 * Command line entry for `npm run env:validate`.
 *
 * Prints one masked line per environment variable and exits with code 0 when
 * the environment satisfies the schema, or code 1 with a value-free issue
 * list. Secret values are always masked; other values are printed as-is
 * because they are documented in .env.example.
 */

function isSecret(key: EnvKey): boolean {
  return SECRET_ENV_KEYS.includes(key);
}

function reportFailure(error: EnvValidationError): void {
  process.stderr.write('env:validate FAIL\n');
  for (const issue of error.issues) {
    process.stderr.write(`  ${issue.key}: ${issue.message}\n`);
  }
  process.stderr.write('Fix the values in .env (see .env.example) and run again.\n');
  process.exitCode = 1;
}

function reportSuccess(): void {
  const env = getEnv();
  process.stdout.write(`env:validate PASS (NODE_ENV=${env.NODE_ENV})\n`);
  for (const key of ENV_SOURCE_KEYS) {
    const value = env[key];
    const display = isSecret(key) ? maskValue(value) : (value ?? '(unset)');
    process.stdout.write(`  ${key}=${display}\n`);
  }
}

function main(): void {
  try {
    reportSuccess();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      reportFailure(error);
      return;
    }
    throw error;
  }
}

main();
