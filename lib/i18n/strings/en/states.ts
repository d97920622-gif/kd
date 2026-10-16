// path: lib/i18n/strings/en/states.ts
/**
 * Copy for the four page states and the accessibility primitives.
 *
 * Why every state has words here rather than in the component that renders it.
 * A page state is what a reader sees when the product cannot show them what
 * they came for, which is exactly the moment a vague sentence costs trust: a
 * loading screen with no label, an error screen that says "something went
 * wrong", an empty screen that leaves the reader wondering whether the product
 * is broken or they are. So each state carries a heading that names what is
 * happening, a sentence that says what to do next, and - where an action exists
 * - the words on the control. Naming them in one namespace is what makes that
 * reviewable in one place instead of in five components.
 *
 * The three empty states are written separately rather than sharing a sentence
 * with a variable, because the reader's situation differs and the copy is the
 * only thing that tells them apart:
 *
 *   - **first use** - there is nothing yet because nothing has been created;
 *     the action creates the first record.
 *   - **filtered** - there is nothing *here*, and the action clears the filter.
 *     The distinction matters: a reader who created records yesterday and sees
 *     "No invoices yet" concludes their data is gone.
 *   - **permission** - there is nothing *for this reader*, and offering them a
 *     create action would be an offer the server refuses.
 *
 * Append protocol: add, never rename or remove. A copy change is a new key.
 */
export const states = {
  // -------------------------------------------------------------------------
  // Loading. Skeleton state, one heading per shape so a screen reader hears
  // what is being fetched rather than the word "loading".
  // -------------------------------------------------------------------------
  label_loading_title: 'Loading',
  label_loading_screen: 'Loading this page. The content appears in a moment.',
  label_loading_table: 'Loading the table. Rows appear in a moment.',
  label_loading_list: 'Loading the list. Items appear in a moment.',
  label_loading_form: 'Loading the form. Fields appear in a moment.',
  label_loading_card: 'Loading the summary. Figures appear in a moment.',

  // -------------------------------------------------------------------------
  // Error. The boundary and the state component read from here; a raw
  // exception message is never shown to a reader.
  // -------------------------------------------------------------------------
  label_error_title: 'This part of the page did not load',
  label_error_description:
    'The rest of the page still works. Try again, and if it keeps failing, report it with the reference below so support can find the exact request.',
  label_error_inline_title: 'This section did not load',
  label_error_inline_description: 'Try again, or carry on with the rest of the page.',
  label_error_correlation: 'Reference',
  label_error_correlation_hint:
    'Quote this reference when you report the problem. It identifies the request, not you.',
  label_error_report_copied:
    'The reference and this page address are on your clipboard. Paste them into the message you send to support.',
  label_error_attempts_one: '{count} attempt so far.',
  label_error_attempts_other: '{count} attempts so far.',
  label_error_retry_wait_one: 'Try again in {count} second',
  label_error_retry_wait_other: 'Try again in {count} seconds',
  action_retry: 'Try again',
  action_report: 'Report this error',
  label_error_not_found_title: 'We could not find that',
  label_error_not_found_description:
    'The link may be old, or the record may have been removed. Use the navigation to find your way back.',
  label_error_permission_title: 'You do not have access to this',
  label_error_permission_description:
    'Your account does not carry the permission this page needs. Ask an owner or an administrator if you believe it should.',
  label_error_offline_title: 'The connection dropped',
  label_error_offline_description:
    'This page needs the network. Your unsaved work stays in the form until the connection returns.',

  // -------------------------------------------------------------------------
  // Empty. Three situations, three sentences, three actions.
  // -------------------------------------------------------------------------
  label_empty_first_title: 'Nothing here yet',
  label_empty_first_description:
    'This is where your records will live. Create the first one and the list starts filling itself in.',
  label_empty_filtered_title: 'No results for this filter',
  label_empty_filtered_description:
    'Your records are still there; the filter is hiding them. Clear it to see everything again.',
  label_empty_permission_title: 'Nothing is shared with you here',
  label_empty_permission_description:
    'This list exists for the account, and your role does not include it. An owner or an administrator can change that.',
  action_empty_first: 'Create the first one',
  action_empty_filtered: 'Clear the filter',
  action_empty_permission: 'Request access',

  // -------------------------------------------------------------------------
  // Success. The panel, the toast and the redirect.
  // -------------------------------------------------------------------------
  label_success_title: 'Done',
  label_success_description:
    'The change was saved and is now part of the record. Nothing else is needed from you.',
  label_success_reference: 'Reference',
  label_success_toast_title: 'Saved',
  label_success_redirect_one: 'Continuing in {count} second',
  label_success_redirect_other: 'Continuing in {count} seconds',
  action_success_continue: 'Continue now',
  action_success_stay: 'Stay on this page',

  // -------------------------------------------------------------------------
  // Accessibility primitives. The one string here is the fallback name of an
  // icon button whose caller forgot one; it exists so the failure is audible
  // rather than silent, and the check fails the build for it before a reader
  // ever hears it.
  // -------------------------------------------------------------------------
  label_icon_button_unnamed: 'Unnamed control',
} as const;
