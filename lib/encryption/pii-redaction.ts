// path: lib/encryption/pii-redaction.ts
import { redactContext, redactText } from '../logger/redaction';

/**
 * Personal and secret data in what the encryption module writes out. This file
 * adds no rules of its own: the logger's redaction (lib/logger/redaction.ts) is
 * the single rule set, so a rule added there reaches every caller. The functions
 * here only shape what the encryption module may pass to a log or an error.
 *
 * An encrypted value, even as an envelope, is never logged whole. The envelope
 * header (purpose and version) is safe and useful; the body is not.
 */

const ENVELOPE_HEADER_PATTERN = /^(kdenc)\.(v1)\.([a-z_]{1,32})\.([1-9][0-9]{0,5})\./;

/** Redact free text (a message, a stack line) with the logger's rules. */
export function redactPersonalText(text: string): string {
  return redactText(text);
}

/** Redact a structured context with the logger's rules. */
export function redactPersonalContext(context: Record<string, unknown>): Record<string, unknown> {
  return redactContext(context);
}

/**
 * A log-safe description of a stored value: its envelope header and nothing
 * else, or a fixed marker when the text is not an envelope. Never returns the
 * ciphertext, iv or tag.
 */
export function describeEnvelope(value: string): string {
  const match = ENVELOPE_HEADER_PATTERN.exec(value);
  if (match === null) {
    return '[REDACTED]';
  }
  return `${String(match[1])}.${String(match[2])}.${String(match[3])}.${String(match[4])}.[REDACTED]`;
}
