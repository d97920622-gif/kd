// path: lib/i18n/strings/en/pricing.ts
/**
 * The pricing page copy, and the single owner of every price in the product.
 *
 * Prices are stored as strings on purpose. The money rule in `docs/PLAN/02` is
 * that money is `numeric(18,4)` with `decimal.js` and never a JavaScript number;
 * a marketing page has no arithmetic to do, so it renders the digits it was
 * given and leaves the arithmetic to the billing module, which will read the
 * same figures from the plan table rather than from this file. A price written
 * as a number here would be the first place the rule broke, and the first place
 * a rounding error became a customer-facing claim.
 *
 * The four plan slugs - free, starter, pro, enterprise - match the plan
 * management requirements (`FEATURE_LIST` item 698). The limits are launch
 * defaults: the entitlement matrix that a later step builds is the owner of
 * their enforcement, and this page is the owner of the words a reader is
 * promised. When the two disagree, the plan table wins and this file is edited.
 *
 * What the page refuses to say: no uptime figure, no certification, no customer
 * count, no "unlimited" beside anything a server has to bill for, and no
 * discount that is not arithmetic a reader can check (a year is ten month
 * payments rather than twelve, which is a real number rather than a slogan).
 */
export const pricing = {
  meta_title: 'Pricing: four plans in US dollars',
  meta_description:
    'A working free plan, Starter and Pro with stated limits, and Enterprise agreed per engagement. Every price is in US dollars and every limit is written down.',

  label_title: 'Pricing',
  label_intro:
    'Every plan bills in US dollars. The free plan is a working plan rather than a trial, and each paid plan states its limits here instead of hiding them in a footnote.',
  label_period_monthly: 'per month',
  label_period_yearly: 'per year, billed once',
  label_popular: 'Most businesses start here',
  label_enterprise_price: 'Agreed per engagement',

  tier_free_name: 'Free',
  tier_free_price_monthly: '0',
  tier_free_price_yearly: '0',
  tier_free_summary: 'For a solo business sending its first documents.',
  tier_free_point_one: 'One user',
  tier_free_point_two: 'Five invoices a month',
  tier_free_point_three: 'Ten clients',
  tier_free_point_four: 'One gigabyte of storage',

  tier_starter_name: 'Starter',
  tier_starter_price_monthly: '12',
  tier_starter_price_yearly: '120',
  tier_starter_summary: 'For a small team that invoices every week.',
  tier_starter_point_one: 'Three users',
  tier_starter_point_two: 'One hundred invoices a month',
  tier_starter_point_three: 'Two hundred and fifty clients',
  tier_starter_point_four: 'Ten gigabytes of storage',

  tier_pro_name: 'Pro',
  tier_pro_price_monthly: '29',
  tier_pro_price_yearly: '290',
  tier_pro_summary: 'For a business with staff, projects and a tax calendar to keep.',
  tier_pro_point_one: 'Ten users, with the roles you define',
  tier_pro_point_two: 'Two thousand invoices a month',
  tier_pro_point_three: 'Clients without a cap',
  tier_pro_point_four: 'One hundred gigabytes of storage',

  tier_enterprise_name: 'Enterprise',
  tier_enterprise_summary: 'For a group with more than one company and an audit to answer.',
  tier_enterprise_point_one: 'Users without a cap, with separated companies',
  tier_enterprise_point_two: 'Volume agreed in writing with your account contact',
  tier_enterprise_point_three: 'Contract terms, data processing and a security review',
  tier_enterprise_point_four: 'A named support route with an agreed response time',

  label_included_title: 'In every plan',
  included_one: 'Invoices, estimates and receipts as PDFs',
  included_two: 'Tax rules you configure per line and per jurisdiction',
  included_three: 'An audit entry on every change, with the author and the time',
  included_four: 'Two-factor sign-in for every user',
  included_five: 'Export of your own data in open formats',

  label_notes_title: 'Before you choose',
  note_usd: 'Prices are in US dollars and exclude any tax your jurisdiction adds.',
  note_annual: 'An annual plan is ten monthly payments charged once, not twelve.',
  note_change:
    'A plan can be changed at any time. The invoice states the period it covers, and the change applies to the period after it.',
  note_data: 'Your data remains yours. Leaving takes an export, which the platform provides.',

  label_cta_title: 'Not sure which plan fits yet?',
  label_cta_body:
    'Start on Free. The limits are written above, so the moment a plan stops fitting is a number a reader can see rather than a surprise on an invoice.',
  action_features: 'Read the features',
  action_about: 'About KD SOLUTION IT',
} as const;
