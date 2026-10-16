// path: lib/forms/form-field-options.ts
import { z } from 'zod';

import { en, t, type EnglishStringKey } from '@/lib/i18n';
import { MONEY_INPUT_PATTERN, parseMoneyOrNull } from '@/lib/utils/currency';

/**
 * Field rules every form on the platform builds from.
 *
 * Two things are enforced here, and both are hard to get right per form:
 *
 * 1. A rule is described by catalogue copy, not by a parser default. The
 *    validation namespace holds one sentence per constraint and none of them
 *    interpolates a bound ("This value is too short."), so the same sentence
 *    is correct for a name of two characters and for a token of forty. Every
 *    builder below passes an explicit message, and the key it uses is typed
 *    against the catalogue, so a missing sentence fails the build instead of
 *    reaching a user. The mapper in `lib/forms/use-mapped-form-errors.ts`
 *    adds the second half of the guarantee: it refuses to display any text
 *    that is not a catalogue sentence.
 *
 * 2. The same schema runs on the client and on the server. The client uses
 *    these builders for immediate feedback; the server validates the same
 *    payload again with the same builders before it trusts a single value.
 *
 * Value shape conventions used across the platform:
 *   - money travels as a string, never as a JavaScript number, and is parsed
 *     with decimal.js so no binary floating point value is ever created;
 *   - dates travel as `YYYY-MM-DD` calendar dates and are compared in UTC;
 *   - text is trimmed here, once, so a server comparison never sees a stray
 *     trailing space.
 *
 * Normalisation is limited on purpose. Values are trimmed and control
 * characters are rejected rather than stripped: silently rewriting what
 * someone typed hides the problem, while an error sentence tells them to fix
 * it. The full sanitisation pass for a request (control characters, HTML,
 * Unicode normalisation, zero-width removal) runs on the server, so a client
 * that skipped this layer would gain nothing.
 */

/** A constraint a field rule can report, mapped to a catalogue sentence. */
export type FieldConstraint =
  | 'required'
  | 'format'
  | 'too_short'
  | 'too_long'
  | 'email'
  | 'url'
  | 'phone'
  | 'country_code'
  | 'date'
  | 'date_in_future'
  | 'date_in_past'
  | 'date_range_before'
  | 'date_range_after'
  | 'number'
  | 'number_too_small'
  | 'number_too_large'
  | 'money'
  | 'money_positive'
  | 'money_not_negative'
  | 'choice'
  | 'selection_required'
  | 'too_many_selections'
  | 'password_length'
  | 'password_classes'
  | 'password_mismatch'
  | 'postal_code'
  | 'tax_registration'
  | 'file_type'
  | 'file_size'
  | 'terms';

/**
 * Catalogue sentence for each constraint. The type is checked against the
 * catalogue, so a renamed or mistyped key is a compile error rather than an
 * English sentence that never appears.
 */
export const FIELD_CONSTRAINT_KEYS = {
  required: 'validation.required_field',
  format: 'validation.invalid_format',
  too_short: 'validation.too_short_text',
  too_long: 'validation.too_long_text',
  email: 'validation.invalid_email',
  url: 'validation.invalid_url',
  phone: 'validation.invalid_phone',
  country_code: 'validation.invalid_country_code',
  date: 'validation.invalid_date',
  date_in_future: 'validation.date_in_future',
  date_in_past: 'validation.date_in_past',
  date_range_before: 'validation.date_before_compare',
  date_range_after: 'validation.date_after_compare',
  number: 'validation.invalid_number',
  number_too_small: 'validation.number_too_small',
  number_too_large: 'validation.number_too_large',
  money: 'validation.invalid_money',
  money_positive: 'validation.money_must_be_positive',
  money_not_negative: 'validation.money_must_not_be_negative',
  choice: 'validation.invalid_choice',
  selection_required: 'validation.selection_required',
  too_many_selections: 'validation.too_many_selections',
  password_length: 'validation.password_too_short',
  password_classes: 'validation.password_needs_character_classes',
  password_mismatch: 'validation.password_mismatch',
  postal_code: 'validation.invalid_postal_code',
  tax_registration: 'validation.invalid_tax_registration',
  file_type: 'validation.unsupported_file_type',
  file_size: 'validation.file_too_large',
  terms: 'validation.terms_not_accepted',
} as const satisfies Record<FieldConstraint, EnglishStringKey>;

/**
 * Every sentence a field rule is allowed to show. The error mapper uses this
 * set to decide whether a message that arrived from a schema may be displayed
 * or has to be replaced by catalogue copy.
 */
export const FIELD_MESSAGES: ReadonlySet<string> = new Set(Object.values(en.validation));

/** True when the text is one of the sentences a field rule may display. */
export function isFieldMessage(message: string): boolean {
  return FIELD_MESSAGES.has(message);
}

/**
 * The sentence for one constraint. A form may replace the default wording for
 * one field ("Enter the invoice reference.") through an override; the override
 * is still a catalogue sentence, so the copy rules keep holding.
 */
export function fieldMessage(constraint: FieldConstraint, override?: string): string {
  return override ?? t(FIELD_CONSTRAINT_KEYS[constraint]);
}

/** Per-field message overrides; every entry replaces one default sentence. */
export type FieldMessageOverrides = Partial<Record<FieldConstraint, string>>;

/** Control characters other than tab, newline and carriage return. */
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** A calendar date in `YYYY-MM-DD`, with no time and no zone attached. */
const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A password needs all four character classes and enough length to matter. */
export const MINIMUM_PASSWORD_LENGTH = 12;
const PASSWORD_CLASS_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;

export interface TextFieldOptions {
  /** Defaults to true: most fields on the platform are required. */
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly messages?: FieldMessageOverrides;
}

function requiredMessage(messages: FieldMessageOverrides | undefined): string {
  return fieldMessage('required', messages?.required);
}

function formatMessage(messages: FieldMessageOverrides | undefined): string {
  return fieldMessage('format', messages?.format);
}

/**
 * Text: trimmed, optionally bounded, and free of control characters.
 *
 * Characters are refused instead of removed. A pasted value that carries a
 * control character is a mistake in the source document or an attempt to
 * smuggle something through, and both cases deserve a sentence rather than a
 * silent edit that the user cannot see.
 */
export function textField(options: TextFieldOptions = {}): z.ZodType<string> {
  const { required = true, minLength, maxLength, pattern, messages } = options;
  let schema = z
    .string({
      required_error: requiredMessage(messages),
      invalid_type_error: formatMessage(messages),
    })
    .trim();

  if (required) {
    schema = schema.min(1, { message: requiredMessage(messages) });
  }
  if (minLength !== undefined) {
    schema = schema.min(minLength, { message: fieldMessage('too_short', messages?.too_short) });
  }
  if (maxLength !== undefined) {
    schema = schema.max(maxLength, { message: fieldMessage('too_long', messages?.too_long) });
  }
  if (pattern !== undefined) {
    schema = schema.regex(pattern, { message: formatMessage(messages) });
  }

  return schema.refine((value) => !CONTROL_CHARACTER_PATTERN.test(value), {
    message: formatMessage(messages),
  });
}

/**
 * Text the user may leave empty. An empty value stays an empty string in the
 * form state; the request encoder turns it into an absent property, so the
 * server never has to guess whether "" means "nothing" or "a space".
 */
export function optionalTextField(options: TextFieldOptions = {}): z.ZodType<string> {
  return textField({ ...options, required: false });
}

/** An email address. The domain's deliverability is checked server side. */
export function emailField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return textField({ maxLength: 254, messages }).pipe(
    z.string().email({ message: fieldMessage('email', messages?.email) }),
  );
}

/** A web address the platform can link to: https only, with a real host. */
export function urlField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return textField({ maxLength: 2048, messages }).refine(
    (value) => {
      if (!value.startsWith('https://')) {
        return false;
      }
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:' && parsed.hostname.includes('.');
      } catch {
        return false;
      }
    },
    { message: fieldMessage('url', messages?.url) },
  );
}

/**
 * A phone number with its country code, in the international form the
 * platform stores (`+` followed by 7 to 15 digits). Display formatting is the
 * formatting utility's job, not this rule's.
 */
export function phoneField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return textField({ maxLength: 20, messages }).refine((value) => /^\+[1-9]\d{6,14}$/.test(value), {
    message: fieldMessage('phone', messages?.phone),
  });
}

/** A postal code: letters, digits, spaces and hyphens, both ends alphanumeric. */
export function postalCodeField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return textField({ maxLength: 12, messages }).refine(
    (value) => /^[A-Za-z0-9][A-Za-z0-9 -]{1,10}[A-Za-z0-9]$/.test(value),
    { message: fieldMessage('postal_code', messages?.postal_code) },
  );
}

/** A tax registration number: letters, digits and the usual separators. */
export function taxRegistrationField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return textField({ maxLength: 32, messages }).refine(
    (value) => /^[A-Za-z0-9][A-Za-z0-9./-]{4,30}$/.test(value),
    { message: fieldMessage('tax_registration', messages?.tax_registration) },
  );
}

export interface MoneyFieldOptions {
  readonly required?: boolean;
  /** The amount must be greater than zero. */
  readonly positive?: boolean;
  /** The amount must be zero or greater. */
  readonly notNegative?: boolean;
  readonly messages?: FieldMessageOverrides;
}

/**
 * A USD amount entered as text.
 *
 * The value stays a string from the input element to the database. It is
 * parsed with decimal.js (through `parseMoneyOrNull`), so no step of the
 * journey creates a binary floating point number that could round a cent away.
 * The pattern allows at most four decimal places because that is the precision
 * the platform stores.
 */
export function moneyField(options: MoneyFieldOptions = {}): z.ZodType<string> {
  const { required = true, positive = false, notNegative = false, messages } = options;
  const moneyMessage = fieldMessage('money', messages?.money);
  const shape = (schema: z.ZodType<string>): z.ZodType<string> =>
    schema.refine((value) => MONEY_INPUT_PATTERN.test(value) && parseMoneyOrNull(value) !== null, {
      message: moneyMessage,
    });

  const base = shape(textField({ required, maxLength: 19, messages }));

  if (positive) {
    return base.refine(
      (value) => {
        const parsed = parseMoneyOrNull(value);
        return parsed !== null && parsed.greaterThan(0);
      },
      { message: fieldMessage('money_positive', messages?.money_positive) },
    );
  }
  if (notNegative) {
    return base.refine(
      (value) => {
        const parsed = parseMoneyOrNull(value);
        return parsed !== null && !parsed.isNegative();
      },
      { message: fieldMessage('money_not_negative', messages?.money_not_negative) },
    );
  }
  return base;
}

/** One value out of a fixed list, for a select or a radio group. */
export function singleChoiceField(
  values: readonly string[],
  messages?: FieldMessageOverrides,
): z.ZodType<string> {
  const allowed = new Set(values);
  return textField({ messages }).refine((value) => allowed.has(value), {
    message: fieldMessage('choice', messages?.choice),
  });
}

export interface MultiChoiceOptions {
  /** Minimum number of selections; zero allows an empty selection. */
  readonly minSelected?: number;
  readonly maxSelected?: number;
  readonly messages?: FieldMessageOverrides;
}

/** Several values out of a fixed list, for a checkbox group. */
export function multiChoiceField(
  values: readonly string[],
  options: MultiChoiceOptions = {},
): z.ZodType<string[]> {
  const { minSelected = 1, maxSelected, messages } = options;
  const allowed = new Set(values);
  const selectionMessage = fieldMessage('selection_required', messages?.selection_required);
  let schema = z
    .array(z.string(), { required_error: selectionMessage, invalid_type_error: selectionMessage })
    .min(minSelected, { message: selectionMessage });

  if (maxSelected !== undefined) {
    schema = schema.max(maxSelected, {
      message: fieldMessage('too_many_selections', messages?.too_many_selections),
    });
  }

  return schema.refine((selected) => selected.every((value) => allowed.has(value)), {
    message: fieldMessage('choice', messages?.choice),
  });
}

/** A password: length first, then the four character classes. */
export function passwordField(messages?: FieldMessageOverrides): z.ZodType<string> {
  return z
    .string({
      required_error: requiredMessage(messages),
      invalid_type_error: formatMessage(messages),
    })
    .min(MINIMUM_PASSWORD_LENGTH, {
      message: fieldMessage('password_length', messages?.password_length),
    })
    .max(200, { message: fieldMessage('too_long', messages?.too_long) })
    .refine((value) => PASSWORD_CLASS_PATTERN.test(value), {
      message: fieldMessage('password_classes', messages?.password_classes),
    });
}

/**
 * Adds the cross-field rule that a password confirmation must equal the
 * password. Neither value is logged, echoed back or kept after the request.
 */
export function withPasswordConfirmation<Values extends Record<string, unknown>>(
  schema: z.ZodType<Values, z.ZodTypeDef, unknown>,
  passwordKey: keyof Values & string,
  confirmationKey: keyof Values & string,
  messages?: FieldMessageOverrides,
): z.ZodEffects<z.ZodType<Values, z.ZodTypeDef, unknown>, Values, unknown> {
  return schema.refine(
    (values) => {
      const password = values[passwordKey];
      const confirmation = values[confirmationKey];
      if (typeof password !== 'string' || typeof confirmation !== 'string') {
        return true;
      }
      if (password.length === 0 && confirmation.length === 0) {
        return true;
      }
      return password === confirmation;
    },
    {
      path: [confirmationKey],
      message: fieldMessage('password_mismatch', messages?.password_mismatch),
    },
  );
}

export interface DateFieldOptions {
  readonly required?: boolean;
  /** The date must be later than today in UTC. */
  readonly inFuture?: boolean;
  /** The date must be today or earlier in UTC. */
  readonly inPast?: boolean;
  readonly messages?: FieldMessageOverrides;
}

/** True when the text is a real calendar date, not only a well shaped string. */
export function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Today in UTC as `YYYY-MM-DD`: the comparison base for every date rule. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** A calendar date, optionally constrained to the future or to the past. */
export function dateField(options: DateFieldOptions = {}): z.ZodType<string> {
  const { required = true, inFuture = false, inPast = false, messages } = options;
  let schema = textField({ required, maxLength: 10, messages });

  if (inFuture) {
    schema = schema.refine((value) => isCalendarDate(value) && value > todayUtc(), {
      message: fieldMessage('date_in_future', messages?.date_in_future),
    });
  }
  if (inPast) {
    schema = schema.refine((value) => isCalendarDate(value) && value <= todayUtc(), {
      message: fieldMessage('date_in_past', messages?.date_in_past),
    });
  }
  return schema.refine((value) => isCalendarDate(value), {
    message: fieldMessage('date', messages?.date),
  });
}

/**
 * An acceptance checkbox. The value must be exactly true, so an unchecked box
 * cannot pass by being absent, empty, or a string that reads as true.
 */
export function acceptanceField(messages?: FieldMessageOverrides): z.ZodType<true> {
  return z.literal(true, {
    errorMap: () => ({ message: fieldMessage('terms', messages?.terms) }),
  });
}

/** A whole number. Counts use this; money never does. */
export function integerField(
  options: {
    readonly minimum?: number;
    readonly maximum?: number;
    readonly messages?: FieldMessageOverrides;
  } = {},
): z.ZodType<number> {
  const { minimum, maximum, messages } = options;
  const numberMessage = fieldMessage('number', messages?.number);
  let schema = z.number({
    required_error: requiredMessage(messages),
    invalid_type_error: numberMessage,
  });

  if (minimum !== undefined) {
    schema = schema.min(minimum, {
      message: fieldMessage('number_too_small', messages?.number_too_small),
    });
  }
  if (maximum !== undefined) {
    schema = schema.max(maximum, {
      message: fieldMessage('number_too_large', messages?.number_too_large),
    });
  }
  return schema.refine((value) => Number.isInteger(value), { message: numberMessage });
}
