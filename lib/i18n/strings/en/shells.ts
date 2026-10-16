// path: lib/i18n/strings/en/shells.ts
/**
 * Copy for the layout specimen page, the internal page that renders each
 * route-group shell with a document of specimen content inside it.
 *
 * The page is a development surface: it lives under the development-only
 * route group and answers 404 outside development, so a customer never reads
 * these strings. They are in the catalogue anyway, because the rule that no
 * component holds literal display text has no exception for internal pages,
 * and because the specimen has to prove that a real page's words work inside
 * the shell rather than prove that filler text fits.
 *
 * Later steps append keys through the append protocol: add, never rename.
 */
export const shells = {
  label_title: 'Layout specimen',
  label_description:
    'Every route-group shell rendered with a document inside it, so the skip link, the focus order and the print rules can be inspected in a browser.',

  label_section_public: 'Public shell',
  label_section_auth: 'Auth shell',

  label_document_title: 'Invoice INV-1042',
  label_document_meta: 'Issued 12 March 2026 to Northwind Traders. Payment due 26 March 2026.',
  label_document_body:
    'Specimen content. This paragraph exists to give the shell something to lay out, to skip over and to print: the shell itself carries no product copy.',
  label_document_link: 'Read the sample terms',
  label_document_action: 'Send invoice',
  label_document_total: 'Total due',
  label_column_description: 'Description',
  label_column_amount: 'Amount',
  label_row_services: 'Consulting services, March',
  label_row_support: 'Support plan, annual',
  label_status_paid: 'Paid',
  label_print_header: 'KD SOLUTION IT, printed document, invoice INV-1042',
  label_print_footer: 'Printed from the layout specimen page.',

  label_specimen_note:
    'The chrome block above the content is marked to disappear in print; the header line below the title is marked to appear only in print.',
  label_chrome_placeholder: 'Navigation and controls live here',
} as const;
