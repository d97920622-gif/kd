// path: lib/i18n/strings/en/forms.ts
/**
 * Form-level copy: the text a form shows about the form itself, as opposed to
 * the copy of one of its fields (validation namespace) or of a failed request
 * (errors namespace, which this namespace reuses rather than duplicates).
 *
 * Only what is genuinely new lives here: the summary heading and the frame
 * for a rejected one-time token. Submit labels come from `common`
 * (action_save, state_saving), a failed submission reuses
 * errors.validation_failed_* or errors.offline_*, and a completed submission
 * reuses common.state_success_*.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const forms = {
  error_summary_title_one: 'There is {count} field that needs attention.',
  error_summary_title_other: 'There are {count} fields that need attention.',

  token_frame_title: 'This form is no longer valid',
  token_frame_message: 'The one-time token sent with this form has already been used.',
  token_frame_action: 'Reload the page to get a fresh form, then send your details again.',
} as const;
