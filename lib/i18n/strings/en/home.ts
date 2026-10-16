// path: lib/i18n/strings/en/home.ts
/**
 * The homepage copy.
 *
 * A marketing page states what a product is for. The rule this file follows is
 * that every sentence has to be true of the platform as it is built, and has to
 * be checkable against something in the repository rather than against a
 * feeling. That rules out four things a homepage normally carries:
 *
 *   - **No customer claims.** There is no "trusted by", no logo wall and no
 *     count of users, because there is no way to evidence them. `FEATURE_LIST`
 *     items 210 to 212 and 215 to 216 describe those sections, and they are
 *     deliberately not on this page until there is a customer to name and a CMS
 *     to name them from.
 *   - **No certifications.** A compliance mark is a claim about an audit that
 *     has not happened. `scripts/checks/public-site.mjs` fails the build on the
 *     words that would make one.
 *   - **No availability promises.** The page describes what the platform does,
 *     never when a module will be switched on for a workspace.
 *   - **No sign-up call to action.** Authentication does not exist yet, so the
 *     two buttons on this page go to the pages that do exist. A call to action
 *     that 404s costs more trust than a shorter list of buttons.
 *
 * The `label_note_build` line at the end of the hero is the honest half of that
 * decision: the reader is told the pages describe the platform as it is built.
 */
export const home = {
  meta_title: 'KD SOLUTION IT: invoicing, payments and tax in one platform',
  meta_description:
    'A multi-tenant platform for invoices, clients, payments, tax documents and reporting, with an audit entry on every change and roles a team can work inside.',

  label_hero_eyebrow: 'Business operations platform',
  label_hero_title: 'Invoices, payments and tax in one place',
  label_hero_body:
    'KD SOLUTION IT keeps the documents a business sends, the money it collects and the tax it owes in one auditable system, so the end of a month is a report rather than a reconstruction.',
  action_hero_features: 'See what it does',
  action_hero_pricing: 'Compare the plans',
  label_note_build:
    'These pages describe the platform as it is built. Each module ships with the checks, the rules and the audit trail it needs before it is switched on for a workspace.',

  label_section_capabilities_title: 'What the platform does',
  label_section_capabilities_body:
    'Six areas carry the work. They share one client list, one currency rule and one audit trail, which is what makes the reporting at the end of the month possible.',

  capability_invoicing_title: 'Invoices and estimates',
  capability_invoicing_body:
    'Numbered documents with a series per business, line items, tax per line and a PDF that prints the same on every device.',
  capability_clients_title: 'Clients and contacts',
  capability_clients_body:
    'One record per client, shared by every module, with the history of what was sent and what was paid attached to it.',
  capability_payments_title: 'Payments and payouts',
  capability_payments_body:
    'Amounts are stored in USD and matched to the document they settle, with every retry and every reversal recorded rather than inferred.',
  capability_tax_title: 'Tax and documents',
  capability_tax_body:
    'Tax determined per line from the rules a business configures, and the reports that carry it, generated from the same data as the invoice.',
  capability_messaging_title: 'Messaging and delivery',
  capability_messaging_body:
    'Every message a client receives is a recorded event with its delivery outcome, so a delivery question is answered from the log.',
  capability_team_title: 'Team and permissions',
  capability_team_body:
    'Roles from owner to staff, plus an accountant who sees the books, with each action attributed to the person who took it.',

  label_section_how_title: 'How it works',
  label_section_how_body: 'Three steps, and the third one never stops.',
  step_one_number: 'Step 1',
  step_one_title: 'Set up the workspace',
  step_one_body:
    'Add the business, the currency and the tax rules. Every table carries a tenant key, so one workspace never sees another.',
  step_two_number: 'Step 2',
  step_two_title: 'Send and collect',
  step_two_body:
    'Raise the document, send it, and let the payment land against it. Each change writes an audit entry with who, what and when.',
  step_three_number: 'Step 3',
  step_three_title: 'Report and reconcile',
  step_three_body:
    'Close the month from the ledger the platform kept while the work was happening, not from a spreadsheet assembled afterwards.',

  label_section_trust_title: 'Built to be verified',
  label_section_trust_body:
    'What follows is how the platform is built. Each line is a rule in the repository that fails the build when it drifts, rather than a promise on a page.',
  trust_audit_title: 'Every change is recorded',
  trust_audit_body:
    'A mutation writes its audit entry in the same transaction, so a change without a record is a change the platform cannot make.',
  trust_isolation_title: 'Tenants are isolated by default',
  trust_isolation_body:
    'Row level security denies by default, and a query that forgets the tenant key returns nothing rather than everything.',
  trust_money_title: 'Money is never a floating point number',
  trust_money_body:
    'Amounts are stored to four decimal places and computed with a decimal library, so a total is the sum a reader expects to see.',
  trust_accessibility_title: 'Readable by everyone',
  trust_accessibility_body:
    'Contrast, focus order, touch targets and the reduced motion preference are verified by the build, and every page is checked at 320 pixels wide.',

  label_section_pricing_title: 'Pricing that starts at zero',
  label_section_pricing_body:
    'The free plan is a working plan rather than a trial. The paid plans add volume, seats and support.',
  action_pricing: 'See every plan',

  label_section_cta_title: 'Read the detail before you trust the summary',
  label_section_cta_body:
    'The features page lists what each module does, and the pricing page states what each plan includes in US dollars.',
  action_cta_features: 'Read the features',
} as const;
