// path: lib/i18n/strings/en/errors.ts
/**
 * User-facing error copy, keyed to the platform error catalogue
 * (lib/errors/error-codes.ts). The wording here is safe to show to any user:
 * it never contains internal text, SQL, provider responses or stack traces.
 *
 * Every family carries three strings:
 *   frame_title    short heading for a card, dialog or banner
 *   frame_message  one sentence explaining what happened
 *   frame_action   what the user should do next
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const errors = {
  validation_failed_frame_title: 'Please check the highlighted fields',
  validation_failed_frame_message: 'Some of the submitted values are not valid.',
  validation_failed_frame_action: 'Correct the fields and submit again.',

  unauthenticated_frame_title: 'Sign in to continue',
  unauthenticated_frame_message: 'Your session is no longer active.',
  unauthenticated_frame_action: 'Sign in again to continue where you left off.',

  forbidden_frame_title: 'Access not permitted',
  forbidden_frame_message: 'Your role does not allow this action.',
  forbidden_frame_action: 'Ask the account owner for access, or choose another action.',

  not_found_frame_title: 'Record not found',
  not_found_frame_message: 'The record does not exist, or it belongs to another account.',
  not_found_frame_action: 'Check the link, or go back to the list and open the record again.',

  conflict_frame_title: 'This record was changed',
  conflict_frame_message: 'Someone else saved this record after you opened it.',
  conflict_frame_action: 'Reload the record to see the latest values, then apply your edit again.',

  duplicate_frame_title: 'This record already exists',
  duplicate_frame_message: 'A record with the same identifying details is already available.',
  duplicate_frame_action: 'Open the existing record, or change the details that must be unique.',

  idempotency_conflict_frame_title: 'Request already received',
  idempotency_conflict_frame_message: 'This request was submitted before with different details.',
  idempotency_conflict_frame_action: 'Start a new request instead of repeating the previous one.',

  precondition_failed_frame_title: 'A required step is missing',
  precondition_failed_frame_message: 'The record is not in a state that allows this action.',
  precondition_failed_frame_action: 'Complete the missing step, then try again.',

  payload_too_large_frame_title: 'The file or data is too large',
  payload_too_large_frame_message: 'The submitted size is above the limit for this screen.',
  payload_too_large_frame_action: 'Reduce the size, or split the content into smaller parts.',

  unsupported_media_type_frame_title: 'This format is not supported',
  unsupported_media_type_frame_message: 'The uploaded file type is not accepted here.',
  unsupported_media_type_frame_action: 'Convert the file to a supported type and upload it again.',

  locked_frame_title: 'Temporarily locked',
  locked_frame_message: 'This account or record is locked for a short time.',
  locked_frame_action: 'Wait for the lock to end, or contact support if it was unexpected.',

  rate_limited_frame_title: 'Too many requests',
  rate_limited_frame_message: 'The request limit was reached for a short period.',
  rate_limited_frame_action: 'Wait a moment, then try the action again.',

  internal_error_frame_title: 'Something went wrong',
  internal_error_frame_message: 'The request could not be completed at this time.',
  internal_error_frame_action:
    'Try again. If it keeps failing, contact support with the reference shown below.',

  configuration_error_frame_title: 'Service temporarily unavailable',
  configuration_error_frame_message: 'This feature is not available right now.',
  configuration_error_frame_action: 'Try again later, or contact support.',

  gateway_error_frame_title: 'Payment was not completed',
  gateway_error_frame_message:
    'The payment provider did not finish the request. No money has moved.',
  gateway_error_frame_action: 'Try the payment again, or use another method.',

  webhook_signature_invalid_frame_title: 'Message rejected',
  webhook_signature_invalid_frame_message:
    'The message could not be verified and was not processed.',
  webhook_signature_invalid_frame_action:
    'Contact support if a payment looks missing while the provider reports success.',

  storage_error_frame_title: 'File storage unavailable',
  storage_error_frame_message: 'The file could not be stored or retrieved right now.',
  storage_error_frame_action: 'Try again in a moment. The record itself was not changed.',

  timeout_frame_title: 'This is taking too long',
  timeout_frame_message: 'The operation exceeded the time limit and was stopped.',
  timeout_frame_action: 'Try again. Large operations may need to be run in smaller parts.',

  compliance_error_frame_title: 'Action not allowed',
  compliance_frame_message: 'A compliance policy blocks this action for your account.',
  compliance_error_frame_action: 'Contact support to review your account status.',

  offline_frame_title: 'No connection',
  offline_frame_message: 'This screen needs a network connection to load data.',
  offline_frame_action: 'Reconnect and the screen will load automatically.',
} as const;
