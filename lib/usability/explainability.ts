// path: lib/usability/explainability.ts
/**
 * Explainability: turning an outcome into the four sentences a reader needs.
 *
 * The component in components/shared/explainability-message.tsx renders the
 * panel; this module decides what the panel is allowed to be, and it is
 * separate for one reason: everything here is called with values that arrive
 * from a server payload, so every one of them is validated before it reaches
 * the screen.
 *
 *   - **The reason is resolved, never trusted.** A payload carries a string,
 *     and a string that this build does not know - a newer processor code, a
 *     renamed reason, a hand-made request - resolves to `unknown_outcome`. The
 *     failure mode that must never happen is a panel with a heading and no
 *     words, because that is the moment the reader is most worried.
 *   - **The key is typed.** `explainabilityKey` builds the catalogue key from
 *     the reason and the part, and the return type is the catalogue's own key
 *     union. A reason that exists without one of its four sentences therefore
 *     fails the type check, which is why the reason list lives beside the copy
 *     in lib/i18n/strings/en/explainability.ts instead of here.
 *   - **The reference is display text and an input.** It is stripped of control
 *     characters (a newline in a reference could forge a second line of panel),
 *     trimmed, length-capped, and refused when nothing is left.
 *   - **The instant is formatted deterministically.** `formatUtcTimestamp`
 *     writes one fixed shape in UTC rather than a locale-dependent string.
 *     That is not a preference: a server and a browser that format the same
 *     instant differently produce a hydration mismatch, so a local-time label
 *     belongs in a client effect in a later step, and this function stays a
 *     pure function of the instant.
 *
 * Pure on purpose: no React, no DOM, no clock, and no import outside the
 * catalogue, so docs/EVIDENCE/step-01/usability-probe.mjs can import this file
 * in Node and exercise every rule above. That last property is why the support
 * link policy lives in the component instead: the URL rule belongs to the
 * sanitizer, and importing it here would drag the whole application i18n tree
 * into the probe's import graph for one branch of one function.
 */
import { explainabilityReasons } from '../i18n/strings/en/explainability.ts';

import type { EnglishStringKey } from '../i18n/types.ts';

/** The four sentences every reason carries, in the order the panel shows them. */
export const EXPLAINABILITY_PARTS = ['headline', 'explanation', 'next', 'expected'] as const;

export type ExplainabilityPart = (typeof EXPLAINABILITY_PARTS)[number];

/** Every reason this build can explain, derived from the catalogue. */
export type ExplainabilityReason = (typeof explainabilityReasons)[number];

/** The reason an unclassifiable outcome resolves to. */
export const FALLBACK_EXPLAINABILITY_REASON: ExplainabilityReason = 'unknown_outcome';

/** Longest reference this module will render. */
export const MAX_REFERENCE_LENGTH = 64;

/** Earliest instant an expected-by label will accept, as epoch milliseconds. */
export const MIN_EXPECTED_AT_MS = Date.UTC(2000, 0, 1);

/** Latest instant an expected-by label will accept, as epoch milliseconds. */
export const MAX_EXPECTED_AT_MS = Date.UTC(2100, 0, 1);

/** Characters that would become structure rather than text if rendered. */
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/g;

/** True when this value is one of the reasons this build knows. */
export function isExplainabilityReason(value: unknown): value is ExplainabilityReason {
  return typeof value === 'string' && (explainabilityReasons as readonly string[]).includes(value);
}

/**
 * The reason to render: the payload's reason when this build knows it, and the
 * fallback otherwise. Never throws and never returns an empty panel.
 */
export function resolveExplainabilityReason(value: unknown): ExplainabilityReason {
  return isExplainabilityReason(value) ? value : FALLBACK_EXPLAINABILITY_REASON;
}

/**
 * The catalogue key for one part of one reason.
 *
 * The return type is the catalogue key union rather than `string`, so a reason
 * that is missing a sentence fails the type check instead of rendering
 * nothing. The template is built from two literal unions, which is what lets
 * the compiler see the key instead of a string.
 */
export function explainabilityKey(
  reason: ExplainabilityReason,
  part: ExplainabilityPart,
): EnglishStringKey {
  return `explainability.${part}_${reason}`;
}

/**
 * A reference as it may be displayed: control characters removed, trimmed,
 * capped, or null when there is nothing legible left to show.
 */
export function sanitizeReference(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const cleaned = value.replace(CONTROL_CHARACTER_PATTERN, '').trim();
  return cleaned.length === 0 ? null : cleaned.slice(0, MAX_REFERENCE_LENGTH);
}

/**
 * A UTC label such as "2026-10-18 09:00 UTC", or null when the value is not a
 * usable instant.
 *
 * It takes either an instant as epoch milliseconds or an ISO-8601 string,
 * because both arrive in practice: an expected-by time comes from a payload as
 * a string, and the autosave indicator has the number its own clock produced.
 * Anything outside this century is treated as a bad value rather than as a
 * date to print.
 */
export function formatUtcTimestamp(value: unknown): string | null {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Date.parse(value.trim()) : NaN;
  if (!Number.isFinite(parsed) || parsed < MIN_EXPECTED_AT_MS || parsed >= MAX_EXPECTED_AT_MS) {
    return null;
  }
  const at = new Date(parsed);
  const year = String(at.getUTCFullYear()).padStart(4, '0');
  const month = String(at.getUTCMonth() + 1).padStart(2, '0');
  const day = String(at.getUTCDate()).padStart(2, '0');
  const hours = String(at.getUTCHours()).padStart(2, '0');
  const minutes = String(at.getUTCMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
}
