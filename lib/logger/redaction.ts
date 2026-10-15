// path: lib/logger/redaction.ts
/**
 * Redaction for log records.
 *
 * Three layers, applied in this order:
 *   1. Registered secret values (environment secrets, API keys loaded at
 *      boot) are replaced wherever they appear, including inside longer text.
 *   2. Sensitive object keys are replaced entirely: passwords, secrets,
 *      tokens, keys, authorization material, session ids, card and bank
 *      fields, tax ids and direct contact fields.
 *   3. Sensitive value shapes are masked: JSON Web Tokens, bearer and basic
 *      credentials, card-like digit runs and email addresses.
 *   4. Registered redaction hooks run last, so a module can add its own
 *      rules without editing this file (append point).
 *
 * Redaction is applied before a record is written, stored or handed to a
 * transport. Nothing sensitive can reach a log sink through this module.
 */

export const REDACTION_PLACEHOLDER = '[REDACTED]';
export const EMAIL_PLACEHOLDER = '[REDACTED_EMAIL]';
export const PHONE_PLACEHOLDER = '[REDACTED_PHONE]';
const MAX_REDACTION_DEPTH = 8;
const MIN_SECRET_LENGTH = 8;

/**
 * Sensitive key names. Match must be a complete word inside the key, so
 * "shipping" or "author" do not match while "cardNumber" and "authToken" do.
 */
const SENSITIVE_KEY_PATTERN =
  /(^|[^a-z])(pass|password|passwd|passphrase|secret|token|apikey|api_key|access_key|private_key|credential|authorization|auth|cookie|session|sessionid|session_id|card|cardnumber|card_number|cvv|cvv2|cvc|cvc2|pan|iban|ssn|taxid|tax_id|account|accountnumber|account_number|routing|routingnumber|routing_number|otp|pin|passport|dob|birthdate|birth_date|email|phone|mobile)([^a-z]|$)/i;

const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\b/g;
const CREDENTIAL_PATTERN = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const DIGIT_RUN_PATTERN = /\b\d(?:[ -]?\d){12,18}\b/g;
// International-format phone numbers only (leading plus); local formats are
// too ambiguous and would mask ordinary invoice and reference numbers.
const PHONE_PATTERN = /\+\d[\d\s().-]{6,18}\d/g;

export type RedactionHook = (context: Record<string, unknown>) => Record<string, unknown>;

const secretValues = new Set<string>();
const hooks: RedactionHook[] = [];

/** Register a secret value that must never appear in a log record. */
export function registerSecretValue(value: string): void {
  if (value.length >= MIN_SECRET_LENGTH) {
    secretValues.add(value);
  }
}

/** Register several secret values, for example from the environment schema. */
export function registerSecretValues(values: readonly string[]): void {
  for (const value of values) {
    registerSecretValue(value);
  }
}

/** Remove every registered secret value (used when rotating a secret). */
export function clearSecretValues(): void {
  secretValues.clear();
}

/** Number of registered secret values, for diagnostics and evidence runs. */
export function getSecretValueCount(): number {
  return secretValues.size;
}

/** Register a redaction hook. Returns a function that unregisters it. */
export function registerRedactionHook(hook: RedactionHook): () => void {
  hooks.push(hook);
  return () => {
    const index = hooks.indexOf(hook);
    if (index >= 0) {
      hooks.splice(index, 1);
    }
  };
}

/** True when a key name denotes sensitive data. */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

/** Mask secrets, credentials, tokens, card-like digits and emails in text. */
export function redactText(text: string): string {
  let result = text;
  for (const secret of secretValues) {
    if (result.includes(secret)) {
      result = result.split(secret).join(REDACTION_PLACEHOLDER);
    }
  }
  result = result.replace(CREDENTIAL_PATTERN, '$1 [REDACTED_CREDENTIAL]');
  result = result.replace(JWT_PATTERN, REDACTION_PLACEHOLDER);
  result = result.replace(EMAIL_PATTERN, EMAIL_PLACEHOLDER);
  result = result.replace(PHONE_PATTERN, PHONE_PLACEHOLDER);
  result = result.replace(DIGIT_RUN_PATTERN, (match) => maskDigitRun(match));
  return result;
}

/** Keep the last four digits of a card-like run, mask everything else. */
function maskDigitRun(match: string): string {
  const digits = match.replace(/[^0-9]/g, '');
  if (digits.length < 13 || digits.length > 19) {
    return match;
  }
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

function redactArray(value: readonly unknown[], depth: number): unknown[] {
  return value.map((item) => redactValue(item, depth + 1));
}

function redactObject(value: object, depth: number): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    result[key] = isSensitiveKey(key) ? REDACTION_PLACEHOLDER : redactValue(entryValue, depth + 1);
  }
  return result;
}

/** Redact a single value, recursively, with a depth limit. */
export function redactValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_REDACTION_DEPTH) {
    return REDACTION_PLACEHOLDER;
  }
  if (typeof value === 'string') {
    return redactText(value);
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return redactArray(value, depth);
  }
  return redactObject(value, depth);
}

/** Redact a log context object and then run every registered hook. */
export function redactContext(context: Record<string, unknown>): Record<string, unknown> {
  const redacted = redactValue(context) as Record<string, unknown>;
  let current = redacted;
  for (const hook of hooks) {
    try {
      current = hook(current);
    } catch {
      current = { ...current, redaction_hook_error: true };
    }
  }
  return current;
}
