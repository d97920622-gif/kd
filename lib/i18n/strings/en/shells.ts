// path: lib/i18n/strings/en/shells.ts
/**
 * Copy for the layout shells and for the specimen page that renders them.
 *
 * Two kinds of string live here. The framing strings - the platform band and
 * the three approval notices - are product copy: they are read by real users
 * of the workspace and of platform administration, and they are referenced by
 * catalogue key from components/layout/role-framing.ts rather than written
 * into a component, so the type check proves the key exists. The specimen
 * strings are read only on the development-only specimen page.
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

  label_section_dashboard: 'Dashboard shell',
  label_section_admin: 'Admin shell',
  label_section_client_portal: 'Client portal shell',
  label_section_unresolved: 'Unresolved reader',

  label_nav_workspace: 'Workspace navigation',
  label_nav_platform: 'Platform navigation',
  label_platform_banner: 'Platform administration',
  label_platform_banner_message:
    'Every change on this surface affects a tenant and is recorded in the audit log.',
  label_notice_ceo_approval:
    'Actions at this level are submitted to the super admin for approval before they take effect.',
  label_notice_admin_staff_approval:
    'Actions at this level are approved by the platform CEO or the super admin before they take effect.',
  label_notice_staff_approval:
    'Your drafts are sent to the owner for approval before anything reaches a client.',
} as const;
