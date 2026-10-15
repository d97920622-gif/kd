// path: lib/errors/error-detail.ts
/**
 * Detail entries attached to a failure envelope.
 *
 * A detail explains what a caller must change: which field failed, which
 * rule applied, which limit was reached. Details are always safe to show to
 * the caller who made the request; internal text belongs in the internal
 * message of the error, never here.
 */

export interface ErrorDetail {
  /** Field path for a validation detail, for example items.0.due_date. */
  readonly path?: string;
  /** Stable machine-readable rule id, for example required or max_length. */
  readonly code?: string;
  /** Short English explanation. */
  readonly message: string;
}

/** Build a validation detail. */
export function fieldDetail(path: string, message: string, code?: string): ErrorDetail {
  return code === undefined ? { path, message } : { path, code, message };
}

/** Build a rule detail that is not tied to a specific field. */
export function ruleDetail(message: string, code?: string): ErrorDetail {
  return code === undefined ? { message } : { code, message };
}
