// path: lib/i18n/strings/en/features.ts
/**
 * The features page copy.
 *
 * Eight modules, each with one paragraph and three capabilities. The structure
 * is deliberate: a marketing page that lists every field of every screen is a
 * page nobody reads, and a page that promises a capability the module does not
 * have is worse than a shorter page. Three capabilities per module is the shape
 * that keeps both failures away.
 *
 * Two rules the copy holds to, both enforced by `scripts/checks/public-site.mjs`:
 *
 *   1. **A capability is stated in the reader's terms, not in the schema's.**
 *      "Tax determined per line from the rules you configure" is checkable;
 *      "advanced tax engine" is a word with no test behind it.
 *   2. **No availability claim.** The page says what the module does. It never
 *      says a module is live, in preview or available now, because the modules
 *      arrive in the steps of the plan and not in the order of this page.
 *
 * Where a module belongs to a later step - payouts, payroll, the tax
 * determination engine, the messaging console - the paragraph describes the
 * capability the plan mandates, and the honest note at the bottom of the page
 * tells the reader where they are reading from.
 */
export const features = {
  meta_title: 'Features: invoices, clients, payments and tax in one platform',
  meta_description:
    'What each module of KD SOLUTION IT does: invoices, clients, payments, tax documents, delivery records, team permissions, reporting and the security baseline.',

  label_title: 'What the platform does',
  label_intro:
    'Eight modules, one client list, one currency rule and one audit trail. Every capability below is described in the terms a reader will meet it in, and none of them is described as available before it is.',
  label_note_build:
    'The platform is built module by module, and each module arrives with the checks that hold its rules in place. This page describes the capability the plan mandates, not a release date.',

  group_invoicing_title: 'Invoices and estimates',
  group_invoicing_body:
    'Documents a business sends, numbered from a series that belongs to that business alone and never repeats a number.',
  group_invoicing_point_one: 'Sequential numbering per business, with a stated series',
  group_invoicing_point_two: 'Line items with quantity, unit price and tax per line',
  group_invoicing_point_three: 'A PDF that prints the same on every device and paper size',
  group_invoicing_point_four: 'Estimates that convert to invoices without retyping the lines',

  group_clients_title: 'Clients and contacts',
  group_clients_body:
    'One record per client, owned by the tenant and shared by every module that needs it.',
  group_clients_point_one: 'Contacts with roles, so a billing address is not a delivery address',
  group_clients_point_two: 'The documents, payments and messages for a client in one history',
  group_clients_point_three: 'Import and export in open formats, with the file kept as evidence',

  group_payments_title: 'Payments and payouts',
  group_payments_body:
    'Money that arrives against a document, recorded as a payment with its own reference rather than as an edit to a total.',
  group_payments_point_one:
    'Amounts stored to four decimal places in USD, never a floating point number',
  group_payments_point_two: 'Partial payments, overpayment and credit held against the client',
  group_payments_point_three:
    'Every retry, reversal and refund recorded as an event with its outcome',

  group_tax_title: 'Tax and documents',
  group_tax_body:
    'Tax determined per line from rules a business configures once and can defend in an audit.',
  group_tax_point_one:
    'Rates per jurisdiction, with the exemption reason recorded when one applies',
  group_tax_point_two: 'Tax documents generated from invoice data rather than typed beside it',
  group_tax_point_three:
    'Reports that reconcile to the ledger the platform kept, not to a copy of it',

  group_messaging_title: 'Messaging and delivery',
  group_messaging_body:
    'Every message the platform sends on behalf of a business, with the outcome of that send.',
  group_messaging_point_one: 'A delivery event per message: accepted, delivered, bounced, refused',
  group_messaging_point_two:
    'Templates a business owns, with the sent version kept with the message',
  group_messaging_point_three:
    'Resend and retry as recorded actions, never as a silent second send',

  group_team_title: 'Team and permissions',
  group_team_body:
    'Roles from owner to staff, plus the accountant who needs the books and nothing else.',
  group_team_point_one:
    'Six roles, and a permission matrix the server enforces rather than the menu',
  group_team_point_two: 'Every action attributed to the person who took it, in the audit entry',
  group_team_point_three: 'A staff member sees their own work, not the margin of the business',

  group_reporting_title: 'Reporting and reconciliation',
  group_reporting_body: 'The month end, from the data the platform kept while the work happened.',
  group_reporting_point_one: 'Aged receivables, revenue by period and tax by jurisdiction',
  group_reporting_point_two: 'A ledger view that ties every number back to the document behind it',
  group_reporting_point_three: 'Exports for the accountant, in formats their tools already read',

  group_security_title: 'Security and governance',
  group_security_body:
    'The baseline every module is built on, shipped in the first step rather than bolted on at the end.',
  group_security_point_one: 'Row level security on every table, denying by default',
  group_security_point_two:
    'A strict content security policy, cooperating headers and an allowlist sanitizer',
  group_security_point_three:
    'An audit trail that a reader can follow from an entry back to its author',

  label_section_next_title: 'Where this leaves you',
  label_section_next_body:
    'The pricing page states what each plan includes, and the keyboard reference documents every shortcut the product answers to.',
  action_pricing: 'See the plans',
  action_shortcuts: 'Keyboard shortcuts',
} as const;
