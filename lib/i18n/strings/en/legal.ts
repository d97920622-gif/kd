// path: lib/i18n/strings/en/legal.ts
/**
 * Copy for the two legal pages of this sub-step: terms of service and privacy
 * (FEATURE_LIST items 229 and 230, from the G4 group the feature list marks as
 * editable through the content module).
 *
 * Neither page prints an agreement, and that is the decision this file records.
 * A licence is a statement made by a business about itself - who it is, what it
 * undertakes, where it is answerable - and a build cannot invent one any more
 * than it can invent a founding year. Writing plausible terms here would be the
 * most expensive sentence in the repository, because a reader could rely on it.
 *
 * What each page can do is state, in plain English, what the document will
 * cover and what the build does today. The privacy page is the one place where
 * that distinction is not a formality: the outline below describes collection,
 * retention and deletion as the platform implements them, which is the part a
 * policy is not allowed to overstate.
 *
 * Append protocol: add, never rename or remove.
 */
export const legal = {
  // ---------------------------------------------------------------------------
  // Terms of service
  // ---------------------------------------------------------------------------
  terms_meta_title: 'Terms of service: what the document covers',
  terms_meta_description:
    'What the terms of service will cover, who supplies the binding text, and how a published version is kept.',

  terms_label_title: 'Terms of service',
  terms_label_intro:
    'This page describes the document that governs the use of the platform. The binding text is supplied by the business that runs this deployment, because a licence is a statement about a real entity and not a sentence a build is free to choose.',

  terms_label_section_covers_title: 'What the document covers',
  terms_cover_point_one: 'Who may use the platform, and what an account is for.',
  terms_cover_point_two:
    'What the business undertakes to provide, and what it does not undertake to provide.',
  terms_cover_point_three: 'Payment terms, and what happens when a plan changes.',
  terms_cover_point_four:
    'What ends an account, and what happens to the records that account created.',

  terms_label_note_publish:
    'A published version is kept with the date it took effect, so a reader can see which version applied to a given period. Until a version is published, this page stays an outline rather than an invented agreement.',

  // ---------------------------------------------------------------------------
  // Privacy
  // ---------------------------------------------------------------------------
  privacy_meta_title: 'Privacy: what the platform holds and why',
  privacy_meta_description:
    'What the platform collects, what it does not collect, how a deletion is answered, and who supplies the binding policy.',

  privacy_label_title: 'Privacy',
  privacy_label_intro:
    'A privacy policy is a description of what a product actually does with data. This page states that description in two halves: what the platform collects and keeps, and what it deliberately does not.',

  privacy_label_section_collect_title: 'What the platform collects',
  privacy_collect_point_one:
    'The account details a workspace owner enters for their business and for the people who work in it.',
  privacy_collect_point_two:
    'The records the workspace creates: clients, invoices, payments, and the figures that describe them.',
  privacy_collect_point_three:
    'A technical record of each request: when it happened, what it asked for and whether it succeeded. That trail is what makes a change to a record provable.',

  privacy_label_section_not_collect_title: 'What the platform does not collect',
  privacy_not_collect_point_one:
    'No advertising identifiers and no analytics that follow a reader to another site.',
  privacy_not_collect_point_two:
    'No tracking pixel in a document or an email the platform sends, so opening an invoice does not report back who opened it.',
  privacy_not_collect_point_three:
    'No payment numbers. Payments are handled by the payment partners, and the platform keeps a reference to the payment rather than the details of it.',

  privacy_label_section_ask_title: 'Asking a question about your data',
  privacy_ask_point_one:
    'A request is made against the workspace it concerns, so an owner or an administrator can answer it with the records in front of them.',
  privacy_ask_point_two:
    'A deletion removes the records it names and leaves the audit entry that says a deletion happened, because the trail is what makes the removal provable.',

  privacy_label_note_scope:
    'What is written above describes what the build does today. The binding policy is supplied by the business that runs this deployment, and the remaining documents of the group - refunds, cookies, data processing, service levels - follow the same rule: an outline on this site, the binding text from the owner.',

  // The two pages are each other's cross reference, and both end at the page
  // that can answer a question about a deployment: terms -> privacy, privacy
  // -> terms, and contact from either.
  action_privacy: 'Read the privacy outline',
  action_terms: 'Read the terms outline',
  action_contact: 'Contact',
} as const;
