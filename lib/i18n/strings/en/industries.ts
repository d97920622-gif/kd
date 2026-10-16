// path: lib/i18n/strings/en/industries.ts
/**
 * Copy for the industries page (FEATURE_LIST item 218).
 *
 * Every industry card is written in three moves: the situation the reader is
 * already in, what the platform does about it, and the rule the platform
 * follows. That shape is deliberate. A landing page for an industry usually
 * fills this space with a customer's name and a result, and this build has
 * neither, so the card has to earn its place with the thing that is actually
 * true: a description of how the product fits the work.
 *
 * The six industries here are the ones whose billing shape differs from each
 * other in a way the product can speak to - hourly, retainer, counter, job,
 * engagement, order. A reader whose business is none of them still learns from
 * the page whether the product understands the difference between a job and a
 * subscription, which is the question an industry page is really answering.
 *
 * Append protocol: add, never rename or remove.
 */
export const industries = {
  meta_title: 'Industries: how the platform fits six kinds of business',
  meta_description:
    'Freelancers, agencies, retail, trades, professional services and online sellers: what changes when invoices, payments and tax live in one workspace.',

  label_title: 'Industries',
  label_intro:
    'A billing system is judged by whether it understands how the money arrives. Six kinds of business, and what the platform does differently for each.',

  label_section_fit_title: 'Where the product fits',

  label_freelance_title: 'Freelancers',
  label_freelance_situation:
    'One person, several clients, and a month that is invoiced in pieces as the work is delivered.',
  label_freelance_work:
    'Send an invoice against a project or an hour count, and let the client follow it from a link rather than from an account they have to create.',
  label_freelance_rule:
    'The record keeps what was quoted, what was sent and what arrived, in that order, because the gap between the second and the third is the only thing a freelancer chases.',

  label_agency_title: 'Agencies',
  label_agency_situation:
    'A team, retainers that renew, and pass-through costs that have to be charged back to the right client.',
  label_agency_work:
    'Keep the client, the retainer and the change orders in one place, and see what each client owes before the month closes rather than after.',
  label_agency_rule:
    'A pass-through cost is a line on an invoice with its own description, never a number folded into a total nobody can explain later.',

  label_retail_title: 'Retail',
  label_retail_situation:
    'Many small sales, a counter or a shop, and a tax rate that applies to almost everything.',
  label_retail_work:
    'Record a sale in seconds, apply tax at the rate configured for the business, and keep the day total rather than a drawer of receipts.',
  label_retail_rule:
    'Tax is computed per line and totalled at the end, so a discount never changes how much tax was charged on the rest of the basket.',

  label_trades_title: 'Trades and field services',
  label_trades_situation:
    'A job quoted on site, materials bought before the work starts, and an invoice written when the job is finished.',
  label_trades_work:
    'Quote, record the materials against the job, and convert the quote into an invoice without retyping what the client already agreed to.',
  label_trades_rule:
    'A quote and an invoice are two records with one origin, so the price a client agreed to is the price the invoice carries.',

  label_services_title: 'Professional services',
  label_services_situation:
    'Engagements that run for months, billed in stages, with a scope that is expected to be documented.',
  label_services_work:
    'Bill a stage of an engagement, attach what was delivered, and keep the payment terms of the engagement visible on every document.',
  label_services_rule:
    'Payment terms belong to the engagement, not to the invoice template, so changing terms does not rewrite history.',

  label_online_title: 'Online sellers',
  label_online_situation:
    'Orders that arrive on their own schedule, from more than one channel, in a currency the seller does not choose.',
  label_online_work:
    'Bring the orders into one list, invoice from the order rather than from memory, and keep the platform fees visible as their own line.',
  label_online_rule:
    'Every order carries the channel it came from, so a month can be read per channel rather than as one total that hides which part grew.',

  label_section_common_title: 'What every one of them gets',
  label_common_point_one:
    'One currency. The platform keeps US dollars, and a figure on a document is the figure the record holds.',
  label_common_point_two:
    'One record per document, with the source it came from, so a figure can be traced to the moment it was created.',
  label_common_point_three:
    'The same rounding rule everywhere: to the nearest cent, with a half cent rounded up.',

  label_note_build:
    'These pages describe the platform as it is built. Each module ships with the checks, the rules and the audit trail it needs before it is switched on for a workspace.',

  action_pricing: 'See what the plans cost',
  action_contact: 'Contact',
} as const;
