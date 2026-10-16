// path: lib/hooks/use-zod-form.ts
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type FieldValues, type UseFormProps, type UseFormReturn } from 'react-hook-form';
import { type ZodType } from 'zod';

/**
 * React Hook Form bound to a Zod schema.
 *
 * Every form in the platform uses this wrapper instead of calling useForm
 * directly, because the defaults below are the ones the accessibility and
 * usability rules require and a caller cannot be relied on to repeat them:
 *
 *   - `mode: 'onBlur'` validates when the user leaves a field. Validating on
 *     every keystroke tells someone their email address is invalid while they
 *     are still typing it, which is noise, not help.
 *   - `reValidateMode: 'onChange'` re-checks a field that already failed as
 *     soon as the user starts fixing it, so the error clears at the moment it
 *     is resolved instead of on the next submit.
 *   - `criteriaMode: 'firstError'` and `shouldFocusError: true` move focus to
 *     the first invalid control after a submit, which is what makes a long
 *     form usable with a keyboard.
 *   - `resolver: zodResolver(schema)` means the client and the server validate
 *     with the same schema. The server validates again and never trusts the
 *     browser; this wrapper only makes the client experience immediate.
 *
 * The generic shape ties the form values to the schema, so a field name that
 * is not in the schema fails the type check rather than failing at runtime.
 */
export function useZodForm<Schema extends ZodType<FieldValues, FieldValues, FieldValues>>(
  schema: Schema,
  options: Omit<UseFormProps<FieldValues>, 'resolver'> = {},
): UseFormReturn<FieldValues> {
  return useForm<FieldValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
    shouldFocusError: true,
    ...options,
  });
}
