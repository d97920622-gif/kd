// path: lib/forms/use-mapped-form-errors.ts
'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFormState, type Control, type FieldValues } from 'react-hook-form';

import { type FormErrorSummaryItem } from '@/components/shared/form-error-summary';
import { fieldMessage, isFieldMessage, type FieldConstraint } from '@/lib/forms/form-field-options';

/**
 * Turns the error state of a form into text a person can act on.
 *
 * React Hook Form hands back a tree of errors keyed by field path. This hook
 * flattens the tree, replaces every message that is not a catalogue sentence
 * (a parser default such as "Invalid input", or text a schema author typed by
 * hand) with catalogue copy, and produces the two things a form needs:
 *
 *   - `messageFor(path)`, the sentence to show under one field;
 *   - `summaryItems`, the list for the error summary at the top of the form,
 *     in the order the fields appear on screen rather than the order the
 *     errors happened to be recorded.
 *
 * The summary takes focus when a submission is rejected, once per attempt.
 * Focus moves to the summary rather than to the first invalid field because
 * the summary explains the whole problem and every entry is a link to the
 * field it describes; a keyboard user reads the list and jumps. Focus is not
 * moved again while the user fixes fields, because stealing focus back would
 * make the form impossible to use.
 *
 * The replacement rule is deliberately strict. A message is displayed only
 * when it is one of the sentences in the validation namespace, or when the
 * schema built it with an override that is itself a catalogue sentence. There
 * is no path from a parser message to the screen.
 */

/** Where one field lives: its path in the form values, id and visible label. */
export interface FormFieldDescriptor {
  /** Dotted path inside the form values, for example `billing.email`. */
  readonly path: string;
  /** Id of the control element, as passed to FormField. */
  readonly fieldId: string;
  /** Label shown above the control, translated. */
  readonly label: string;
}

export interface UseMappedFormErrorsOptions {
  readonly control: Control<FieldValues>;
  /** Fields to report, in the order they appear on screen. */
  readonly fields: readonly FormFieldDescriptor[];
  /**
   * Show the summary only after the first submit attempt. Inline messages are
   * unaffected: a field that fails on blur still explains itself immediately.
   */
  readonly summaryOnSubmitOnly?: boolean;
}

export interface MappedFormErrors {
  /** Sentence per field path, catalogue copy only. */
  readonly errors: Readonly<Record<string, string>>;
  /** True when at least one field is invalid. */
  readonly hasErrors: boolean;
  /** Focusable entries for the error summary, in screen order. */
  readonly summaryItems: readonly FormErrorSummaryItem[];
  /** Attach to the error summary so it can take focus when it appears. */
  readonly summaryRef: React.RefObject<HTMLDivElement | null>;
  /** Sentence for one field path, or undefined when the field is valid. */
  readonly messageFor: (path: string) => string | undefined;
}

/** A leaf of the error tree: a message plus the code and path that produced it. */
interface RawFieldError {
  readonly path: string;
  readonly message: string;
  readonly code: string | null;
}

/** True when the node is a leaf of the error tree rather than a branch. */
function isErrorLeaf(node: unknown): node is { message: unknown; type?: unknown } {
  return typeof node === 'object' && node !== null && 'message' in node;
}

/** Walks the error tree and collects one entry per invalid field. */
function collectRawErrors(node: unknown, path: string, collected: RawFieldError[]): void {
  if (isErrorLeaf(node)) {
    const message = typeof node.message === 'string' ? node.message : '';
    const code = 'type' in node && typeof node.type === 'string' ? node.type : null;
    collected.push({ path, message, code });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) => {
      collectRawErrors(child, path === '' ? String(index) : `${path}.${index}`, collected);
    });
    return;
  }
  if (typeof node === 'object' && node !== null) {
    for (const [key, child] of Object.entries(node)) {
      collectRawErrors(child, path === '' ? key : `${path}.${key}`, collected);
    }
  }
}

/**
 * Rule identifiers that both sides of the platform use, mapped to the
 * constraint whose sentence describes them. Zod reports the first group, the
 * server's field details report the second, and a rule id from neither falls
 * back to the generic format sentence.
 */
const RULE_CONSTRAINTS: Readonly<Record<string, FieldConstraint>> = {
  required: 'required',
  invalid_type: 'required',
  too_short: 'too_short',
  min_length: 'too_short',
  min: 'too_short',
  too_long: 'too_long',
  max_length: 'too_long',
  max: 'too_long',
  too_small: 'number_too_small',
  too_big: 'number_too_large',
  invalid_string: 'format',
  invalid_format: 'format',
  email: 'email',
  url: 'url',
  phone: 'phone',
  postal_code: 'postal_code',
  tax_registration: 'tax_registration',
  invalid_date: 'date',
  date_in_future: 'date_in_future',
  date_in_past: 'date_in_past',
  invalid_enum_value: 'choice',
  invalid_literal: 'choice',
  invalid_choice: 'choice',
  selection_required: 'selection_required',
  too_many_selections: 'too_many_selections',
  money: 'money',
  money_positive: 'money_positive',
  money_not_negative: 'money_not_negative',
  password_length: 'password_length',
  password_classes: 'password_classes',
  password_mismatch: 'password_mismatch',
  terms: 'terms',
  file_type: 'file_type',
  file_size: 'file_size',
};

/**
 * The sentence to show for an error. Catalogue copy passes through; anything
 * else is replaced by the catalogue sentence for the kind of failure, so a
 * user never reads parser text, a field path, or an English string that a
 * schema author typed by hand.
 */
export function mappedMessage(message: string, code: string | null): string {
  if (isFieldMessage(message)) {
    return message;
  }
  if (code !== null) {
    const constraint = RULE_CONSTRAINTS[code];
    if (constraint !== undefined) {
      return fieldMessage(constraint);
    }
  }
  return fieldMessage('format');
}

export function useMappedFormErrors({
  control,
  fields,
  summaryOnSubmitOnly = true,
}: UseMappedFormErrorsOptions): MappedFormErrors {
  const { errors, submitCount } = useFormState({ control });
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const focusedSubmitCount = useRef(0);

  const rawErrors = useMemo(() => {
    const collected: RawFieldError[] = [];
    collectRawErrors(errors, '', collected);
    return collected;
  }, [errors]);

  const mapped = useMemo(() => {
    const record: Record<string, string> = {};
    for (const raw of rawErrors) {
      record[raw.path] = mappedMessage(raw.message, raw.code);
    }
    return record;
  }, [rawErrors]);

  const summaryItems = useMemo<readonly FormErrorSummaryItem[]>(() => {
    return fields.flatMap((field) => {
      const message = mapped[field.path];
      if (message === undefined) {
        return [];
      }
      return [{ fieldId: field.fieldId, label: field.label, message }];
    });
  }, [fields, mapped]);

  const summaryVisible = summaryItems.length > 0 && (!summaryOnSubmitOnly || submitCount > 0);

  useEffect(() => {
    if (!summaryVisible || submitCount === 0 || submitCount === focusedSubmitCount.current) {
      return;
    }
    focusedSubmitCount.current = submitCount;
    summaryRef.current?.focus();
  }, [summaryVisible, submitCount]);

  const messageFor = useCallback((path: string) => mapped[path], [mapped]);

  return {
    errors: mapped,
    hasErrors: rawErrors.length > 0,
    summaryItems: summaryVisible ? summaryItems : [],
    summaryRef,
    messageFor,
  };
}
