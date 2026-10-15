// path: lib/i18n/strings/en/validation.ts
/**
 * Field-level validation copy.
 *
 * These strings are shown next to an input and are also the messages a Zod
 * schema can reference, so the client and the server describe a rule with
 * the same words. They must always say what the user should enter, not what
 * the parser saw.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const validation = {
  required_field: 'This field is required.',
  invalid_format: 'Enter the value in the expected format.',
  too_short_text: 'This value is too short.',
  too_long_text: 'This value is too long.',
  invalid_email: 'Enter a valid email address.',
  invalid_url: 'Enter a valid web address starting with https://.',
  invalid_phone: 'Enter a valid phone number with the country code.',
  invalid_country_code: 'Choose a country from the list.',
  invalid_date: 'Enter a valid date.',
  date_in_future: 'The date must be in the future.',
  date_in_past: 'The date must not be in the past.',
  date_before_compare: 'This date must be on or before the compared date.',
  date_after_compare: 'This date must be on or after the compared date.',
  invalid_number: 'Enter a valid number.',
  number_too_small: 'This value is below the allowed minimum.',
  number_too_large: 'This value is above the allowed maximum.',
  invalid_money: 'Enter a USD amount with up to four decimal places.',
  money_must_be_positive: 'Enter an amount greater than 0.00.',
  money_must_not_be_negative: 'Enter an amount of 0.00 or more.',
  currency_not_supported: 'Only USD is supported on this platform.',
  invalid_choice: 'Choose one of the listed options.',
  selection_required: 'Choose at least one option.',
  too_many_selections: 'Select fewer options.',
  password_too_short: 'Use at least 12 characters.',
  password_needs_character_classes: 'Use upper case, lower case, a number and a symbol.',
  password_mismatch: 'The two passwords do not match.',
  invalid_tax_registration: 'Enter a valid tax registration number.',
  invalid_postal_code: 'Enter a valid postal code.',
  unsupported_file_type: 'Choose a file in a supported format.',
  file_too_large: 'Choose a smaller file.',
  terms_not_accepted: 'Accept the terms to continue.',
} as const;
