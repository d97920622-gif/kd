// path: lib/forms/form-submission.ts
'use client';

import { type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { type FormFieldDescriptor } from '@/lib/forms/use-mapped-form-errors';

/**
 * Reads the answer to a submission and puts it back where a form can use it.
 *
 * Every API response on the platform is one of two shapes, defined once in
 * lib/errors/envelope.ts and parsed here with Zod, because a client that
 * trusts the shape of a response is a client that breaks in production:
 *
 *   success: { "data": T, "meta": { "correlation_id": "..." } }
 *   failure: { "error": { "code", "message", "details", "correlation_id" } }
 *
 * Two things happen with a failure that a plain `throw` cannot do:
 *
 *   1. Field details become field errors. When the server rejects a value the
 *      client accepted (a rule that only the database can check, a record
 *      someone else created, a limit reached between render and submit), the
 *      sentence belongs under the field that caused it, not in a banner the
 *      user has to translate into "which field?". Only paths that identify a
 *      field of this form are applied; anything else is returned as form-level
 *      feedback, so a detail is never silently dropped.
 *   2. The correlation id survives. It is the one value that ties what the user
 *      saw to what the server logged, so the form can show it and support can
 *      find the exact request.
 *
 * The parser never throws. An unrecognised body is reported as unknown, and
 * the caller shows the internal error frame rather than a shape error, because
 * a user cannot act on a schema violation.
 */

const errorDetailSchema = z.object({
  path: z.string().optional(),
  code: z.string().optional(),
  message: z.string(),
});

const successEnvelopeSchema = z.object({
  data: z.unknown(),
  meta: z.object({ correlation_id: z.string().optional() }).passthrough().optional(),
});

const failureEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(errorDetailSchema).default([]),
    correlation_id: z.string(),
    retry_after_seconds: z.number().optional(),
  }),
});

/** A field-level detail returned by the server. */
export interface SubmissionDetail {
  readonly path: string | null;
  readonly code: string | null;
  readonly message: string;
}

export interface SubmissionSuccess {
  readonly kind: 'success';
  readonly data: unknown;
  readonly correlationId: string | null;
}

export interface SubmissionFailure {
  readonly kind: 'failure';
  readonly code: string;
  readonly correlationId: string;
  readonly details: readonly SubmissionDetail[];
  readonly retryAfterSeconds: number | null;
}

export interface SubmissionUnknown {
  readonly kind: 'unknown';
}

export type SubmissionOutcome = SubmissionSuccess | SubmissionFailure | SubmissionUnknown;

/** Reads a response body into one of the three outcomes. */
export function readSubmissionOutcome(payload: unknown): SubmissionOutcome {
  const failure = failureEnvelopeSchema.safeParse(payload);
  if (failure.success) {
    return {
      kind: 'failure',
      code: failure.data.error.code,
      correlationId: failure.data.error.correlation_id,
      details: failure.data.error.details.map((detail) => ({
        path: detail.path ?? null,
        code: detail.code ?? null,
        message: detail.message,
      })),
      retryAfterSeconds: failure.data.error.retry_after_seconds ?? null,
    };
  }

  const success = successEnvelopeSchema.safeParse(payload);
  if (success.success) {
    return {
      kind: 'success',
      data: success.data.data,
      correlationId: success.data.meta?.correlation_id ?? null,
    };
  }

  return { kind: 'unknown' };
}

export interface AppliedServerErrors {
  /** Number of details attached to a field of this form. */
  readonly applied: number;
  /** Details that belong to no field, in the order the server sent them. */
  readonly formLevel: readonly SubmissionDetail[];
}

/**
 * Attaches the server's field details to the form.
 *
 * A detail is applied only when its path names a field of this form. The
 * message is left exactly as it arrived: the mapping hook decides whether it
 * is a catalogue sentence and replaces it when it is not, so raw parser text
 * still cannot reach the screen.
 */
export function applyServerFieldErrors(
  form: UseFormReturn<FieldValues>,
  details: readonly SubmissionDetail[],
  fields: readonly FormFieldDescriptor[],
): AppliedServerErrors {
  const knownPaths = new Set(fields.map((field) => field.path));
  const formLevel: SubmissionDetail[] = [];
  let applied = 0;

  for (const detail of details) {
    if (detail.path === null || !knownPaths.has(detail.path)) {
      formLevel.push(detail);
      continue;
    }
    form.setError(detail.path as Path<FieldValues>, {
      type: detail.code ?? 'server',
      message: detail.message,
    });
    applied += 1;
  }

  return { applied, formLevel };
}
