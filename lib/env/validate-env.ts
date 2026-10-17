// path: lib/env/validate-env.ts
import { z } from 'zod';

import { decodeRootKey } from '../encryption/root-key';
import { AppError } from '../errors/app-error';

/**
 * Environment schema validation with boot-time fail fast.
 *
 * Rules honoured here:
 *   - Every environment variable is validated by one Zod schema.
 *   - A missing or malformed variable throws EnvValidationError; the process
 *     must not start with an invalid configuration.
 *   - Error messages never echo a value, so a mistyped secret can never reach
 *     a log line through a validation report.
 *   - Server-only keys are listed in SECRET_ENV_KEYS and are masked in every
 *     report and redacted by the structured logger (sub-step 1.8).
 *
 * The production-required list applies at server boot. It is skipped during
 * the Next.js production build phase, where the deployment environment does
 * not need runtime secrets to compile the application.
 *
 * EnvValidationError extends AppError (lib/errors, sub-step 1.9) so the
 * platform has one error hierarchy with one code per condition. The import
 * is limited to the base class, which itself depends only on the error code
 * catalogue, so validation can never fail for a reason unrelated to the
 * environment it is checking.
 */

/** Every variable the platform reads, in documentation order. */
export const ENV_SOURCE_KEYS = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'LOG_LEVEL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
] as const;

export type EnvKey = (typeof ENV_SOURCE_KEYS)[number];

/** Server-only values that must never appear in a log, report or response. */
export const SECRET_ENV_KEYS: readonly EnvKey[] = [
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
];

/** Variables that must be present and non-empty when the server boots. */
export const PRODUCTION_REQUIRED_KEYS: readonly EnvKey[] = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ENCRYPTION_KEY',
];

const enumMessage = (values: readonly string[]): string => `must be one of: ${values.join(', ')}`;

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'], {
        errorMap: () => ({ message: enumMessage(['development', 'test', 'production']) }),
      })
      .default('development'),
    NEXT_PUBLIC_APP_URL: z
      .string()
      .url({ message: 'must be a valid absolute URL' })
      .default('http://localhost:3000'),
    LOG_LEVEL: z
      .enum(['debug', 'info', 'warn', 'error'], {
        errorMap: () => ({ message: enumMessage(['debug', 'info', 'warn', 'error']) }),
      })
      .default('info'),
    SUPABASE_URL: z.string().url({ message: 'must be a valid absolute URL' }).optional(),
    SUPABASE_ANON_KEY: z.string().min(20, { message: 'must be at least 20 characters' }).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(20, { message: 'must be at least 20 characters' })
      .optional(),
    // The encryption root key (sub-step 2.9). Accepted only as 32 random bytes in
    // canonical base64; the message never repeats the value.
    ENCRYPTION_KEY: z
      .string()
      .refine((value) => decodeRootKey(value) !== null, {
        message:
          'must be 32 random bytes in base64 (44 characters, for example openssl rand -base64 32)',
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }
    if (isProductionBuildPhase()) {
      return;
    }
    for (const key of PRODUCTION_REQUIRED_KEYS) {
      if (value[key] === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: 'is required when NODE_ENV is production',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export interface EnvIssue {
  readonly key: EnvKey | 'environment';
  readonly message: string;
}

/** Thrown at boot when the environment does not satisfy the schema. */
export class EnvValidationError extends AppError {
  readonly issues: readonly EnvIssue[];

  constructor(issues: readonly EnvIssue[]) {
    super('env_validation_failed', 'The service configuration is incomplete.', {
      internalMessage: describeIssues(issues),
      exposeMessage: false,
    });
    this.issues = issues;
  }
}

/** Internal, value-free description of the failing keys. */
function describeIssues(issues: readonly EnvIssue[]): string {
  return `env validation failed: ${issues.map((issue) => `${issue.key} ${issue.message}`).join('; ')}`;
}

/** True while Next.js runs the production build compiler. */
function isProductionBuildPhase(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.NEXT_PHASE === 'phase-production-build';
}

/**
 * Validate an environment source and return the typed environment.
 * Throws EnvValidationError with a value-free issue list.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const issues: EnvIssue[] = result.error.issues.map((issue) => {
    const first = issue.path[0];
    const key: EnvKey | 'environment' =
      typeof first === 'string' ? (first as EnvKey) : 'environment';
    return { key, message: issue.message };
  });
  throw new EnvValidationError(issues);
}

let cachedEnv: Env | null = null;

/** Typed, memoized access to the validated environment. Fails fast at boot. */
export function getEnv(): Env {
  if (cachedEnv === null) {
    cachedEnv = parseEnv();
  }
  return cachedEnv;
}

/** Mask any value for display. Values are never printed in full. */
export function maskValue(value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    return '(unset)';
  }
  if (value.length <= 8) {
    return '********';
  }
  return `${value.slice(0, 2)}********${value.slice(-2)}`;
}

/** Secret values of the current environment, for the logger redaction hook. */
export function collectSecretValues(env: Env): string[] {
  const values: string[] = [];
  for (const key of SECRET_ENV_KEYS) {
    const value = env[key];
    if (typeof value === 'string' && value.length >= 8) {
      values.push(value);
    }
  }
  return values;
}

/** True when the application runs in the production environment. */
export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

/** True when the application runs in the development environment. */
export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}
