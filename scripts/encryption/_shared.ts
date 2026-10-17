// path: scripts/encryption/_shared.ts
/**
 * Shared plumbing for the encryption command line (sub-step 2.9).
 *
 * The database commands run through runCommand in scripts/db/_shared.mjs, so
 * they take the same deployment lock and print the same failure line as the
 * other database commands. The one difference: runCommand prints a thrown
 * AppError's client-facing message, which for a configuration problem is a
 * generic sentence. This module turns an AppError into its internal message
 * first, so the operator sees which key or version was refused. Internal
 * messages never contain key material.
 *
 * Only this file and lib/env/validate-env.ts read the environment for the root
 * key. Every other encryption script takes the key from vaultFromEnvironment().
 */
import {
  ENCRYPTION_CONFIG,
  ENCRYPTION_PURPOSES,
  type EncryptionPurpose,
} from '../../config/encryption';
import { loadKeyVault, type KeyVault } from '../../lib/encryption/key-vault';
import { parseEnv } from '../../lib/env/validate-env';
import { AppError } from '../../lib/errors/app-error';
import { fail, runCommand } from '../db/_shared.mjs';

export { ENCRYPTION_CONFIG, ENCRYPTION_PURPOSES, fail, runCommand };
export type { EncryptionPurpose };

/** The subset of a pg client these commands use. */
export interface Db {
  query(text: string, values?: readonly unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

/** One output line, on stdout, with a newline. */
export function write(text: string): void {
  process.stdout.write(`${text}\n`);
}

/** Run a step and turn an AppError into a CliError carrying its internal message. */
export function withInternalMessages<T>(step: () => T): T {
  try {
    return step();
  } catch (error) {
    if (error instanceof AppError) {
      fail(error.internalMessage);
    }
    throw error;
  }
}

/**
 * The vault built from the environment root key. A missing or malformed key
 * stops the command with one line that says which rule it broke.
 */
export function vaultFromEnvironment(): KeyVault {
  return withInternalMessages(() => loadKeyVault(parseEnv().ENCRYPTION_KEY));
}

/** Read an integer column. A non-integer value is a failed assumption, not a zero. */
export function integerOf(value: unknown, column: string): number {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value);
  }
  return fail(`column ${column} is not an integer`);
}

/**
 * Run a command's main function. A failure outside runCommand (argument errors)
 * prints one line and sets the exit code, with no stack trace.
 */
export function start(main: () => Promise<void>): void {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}

/** Read a text column. */
export function textOf(value: unknown, column: string): string {
  if (typeof value === 'string') {
    return value;
  }
  return fail(`column ${column} is not text`);
}
