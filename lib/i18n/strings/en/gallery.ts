// path: lib/i18n/strings/en/gallery.ts
/**
 * Copy for the component gallery, the internal page where every shared
 * component is rendered in all four themes.
 *
 * The gallery is a development surface: in a production build the route
 * answers 404, so these strings are never shown to a customer.
 *
 * They still live in the catalogue. A page that hardcodes its own headings
 * cannot be translated, and the rule has no exception for internal pages.
 * Every visible string on the page, including the text that fills a demo
 * input, is a key here; ids, amounts and references are data and stay in code.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const gallery = {
  label_title: 'Component gallery',
  label_description:
    'Every shared component rendered in light, dark, high contrast and reduced motion, in one page.',
  label_theme_scope: 'Theme scope',
  label_section_buttons: 'Buttons',
  label_section_form_controls: 'Form controls',
  label_section_panels: 'Panels and overlays',
  label_section_feedback: 'Feedback and status',
  label_section_data: 'Data display',
  label_section_form_primitives: 'Form primitives',
  label_section_states: 'Form states and flow',
  label_scope_light: 'Light',
  label_scope_dark: 'Dark',
  label_scope_hc_light: 'High contrast light',
  label_scope_hc_dark: 'High contrast dark',
  label_scope_reduced_motion: 'Reduced motion',

  label_demo_name: 'Full name',
  label_demo_email: 'Email address',
  label_demo_email_hint: 'Invoices and receipts are sent to this address.',
  label_demo_company: 'Company name',
  label_demo_amount: 'Invoice amount',
  label_demo_amount_hint: 'Enter the amount in USD, up to four decimal places.',
  label_demo_notes: 'Notes',
  label_demo_notes_hint: 'Optional. Visible to your team only.',
  label_demo_plan: 'Plan',
  label_demo_terms: 'I accept the terms of service',
  label_demo_newsletter: 'Send me product updates',
  label_demo_payment_method: 'Payment method',
  label_demo_method_card: 'Payment card',
  label_demo_method_transfer: 'Bank transfer',
  label_demo_new_client: 'This is a new client',
  label_demo_fail_next: 'Refuse this submission to show the error state',
  label_demo_open_dialog: 'Open a dialog',
  label_demo_open_sheet: 'Open a side panel',
  label_demo_open_popover: 'Open a popover',
  label_demo_open_menu: 'Open a menu',
  label_demo_delete: 'Delete this invoice',
  label_demo_invalid_email: 'Email address, shown with the error state',
  label_demo_search: 'Search the gallery',
  label_demo_dialog_title: 'Delete this invoice',
  label_demo_dialog_message: 'Deleting an invoice keeps its number reserved for audit purposes.',
  label_demo_sheet_title: 'Invoice details',
  label_demo_sheet_message: 'A side panel keeps the list visible while one record is edited.',
  label_demo_popover_title: 'Amount and tax',
  label_demo_popover_message: 'Amounts are stored in USD and rounded to four decimal places.',
  label_demo_menu_edit: 'Edit invoice',
  label_demo_menu_duplicate: 'Duplicate invoice',
  label_demo_tab_overview: 'Overview',
  label_demo_tab_lines: 'Line items',
  label_demo_tab_overview_body: 'The overview shows the totals and the due date.',
  label_demo_tab_lines_body: 'Each line item carries its own quantity and unit price.',
  label_demo_tooltip: 'Amounts are stored in USD.',
  label_demo_toast_title: 'Invoice saved',
  label_demo_toast_message: 'The reminder schedule was updated with the new due date.',
  label_demo_table_caption: 'The four most recent invoices of this account',
  label_demo_table_reference: 'Reference',
  label_demo_table_client: 'Client',
  label_demo_table_amount: 'Amount',
  label_demo_table_status: 'Status',
  label_demo_status_sent: 'Sent',
  label_demo_status_paid: 'Paid',
  label_demo_client_one: 'Example Trading Ltd',
  label_demo_client_two: 'Northwind Studio',
  label_demo_plan_starter: 'Starter',
  label_demo_plan_growth: 'Growth',
  label_demo_plan_scale: 'Scale',
  label_demo_value_name: 'Entered name',
  label_demo_value_email: 'client@example.test',
  label_demo_value_email_invalid: 'client@',
  label_demo_value_company: 'Example Trading Ltd',
  label_demo_value_notes: 'Visible to the team that owns this record.',
} as const;
