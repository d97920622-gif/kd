// path: lib/i18n/strings/en/about.ts
/**
 * The about page copy.
 *
 * An about page is the easiest page on a website to fill with facts nobody can
 * check: a founding year, a headcount, an address, a mission statement with a
 * number in it. This one holds none of them, and that is a decision rather than
 * an omission. Company facts belong to the owner of the company and to the
 * contact page that carries them (`FEATURE_LIST` item 225); inventing a
 * founding year here would put a false statement on the site with the same
 * authority as a true one, and nothing would ever fail.
 *
 * What the page says instead is what the product is and how it is built, both
 * of which are checkable inside this repository. The how section names the
 * rules a build has to satisfy - language, contrast, dead links, money
 * arithmetic, storage secrets - because those are rules a reader can watch
 * being enforced: `npm run verify` is the same command on every commit.
 *
 * The "who it is for" section describes audiences rather than customers. An
 * audience can be described from the modules a plan carries; a customer cannot
 * be described at all until there is one.
 */
export const about = {
  meta_title: 'About KD SOLUTION IT',
  meta_description:
    'What KD SOLUTION IT is, how the platform is built, and the engineering rules every module is held to before it reaches a workspace.',

  label_title: 'About',
  label_intro:
    'KD SOLUTION IT builds business operations software: invoicing, clients, payments, tax and the reporting that ties them together, for small businesses and the groups that own them.',

  label_section_what_title: 'What the platform is',
  label_section_what_body:
    'One multi-tenant platform where a business keeps its clients, its documents, its money and its tax in a single auditable place. Every table carries a tenant key, every mutation writes an audit entry, and every amount is stored to four decimal places in US dollars.',
  what_point_one:
    'A tenant is an isolated workspace, enforced in the database rather than in a menu',
  what_point_two: 'A mutation and its audit entry are written in the same transaction',
  what_point_three: 'A document is generated from stored data, never retyped into a second place',
  what_point_four:
    'Money is computed with a decimal library, so a total is the sum a reader expects',

  label_section_how_title: 'How it is built',
  label_section_how_body:
    'The platform is built in sixteen steps, and a step closes only when its decisions are enforced by something that fails when they drift. That is the difference between a rule and a preference.',
  how_checks_title: 'Rules that fail the build',
  how_checks_body:
    'Language, path comments, forbidden brand names, money arithmetic, stored secrets, dead links, colour contrast, token drift and the 320 pixel layout are checked on every commit, by the same command a developer runs before pushing.',
  how_honest_title: 'Copy that says what is true',
  how_honest_body:
    'A page states what the platform does and what it does not do yet. No page claims a customer, a count of users or a certification, because none of those can be evidenced from this repository.',
  how_hardening_title: 'Security decided before the features',
  how_hardening_body:
    'A strict content security policy, cooperating headers and an allowlist sanitizer shipped in the first step, before there was a session to protect. Later steps inherit a baseline they cannot loosen.',
  how_accessibility_title: 'Accessibility as a build rule',
  how_accessibility_body:
    'Contrast ratios, focus order, landmark structure, touch targets and the reduced motion preference are verified by the same build as everything else, not audited once and forgotten.',

  label_section_audience_title: 'Who it is for',
  label_section_audience_body:
    'The platform is aimed at businesses that send documents for money and have to report the result.',
  audience_one: 'Agencies and studios that invoice per project and track what is still unpaid',
  audience_two: 'Retail and wholesale businesses with a product catalogue and tax to report',
  audience_three: 'Professional firms with a small team and a bookkeeper to invite',
  audience_four: 'Groups holding more than one company, which need the companies kept apart',

  label_section_next_title: 'Where to go next',
  label_section_next_body:
    'The features page lists what each module does, the pricing page states what each plan includes, and the shortcut reference documents the keyboard.',
  action_features: 'Features',
  action_pricing: 'Pricing',
  action_shortcuts: 'Keyboard shortcuts',
} as const;
