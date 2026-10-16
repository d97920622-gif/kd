// path: lib/i18n/strings/en/contact.ts
/**
 * Copy for the contact page (FEATURE_LIST item 225).
 *
 * The page has one rule and it shapes everything on it: no address, telephone
 * number or response window is printed, because those are facts the owner of a
 * deployment supplies and a repository cannot invent. What the page can do
 * honestly is prepare the reader to send a useful message and describe what the
 * support module will do with it, which is what it does.
 *
 * The "what never goes in a message" section is not decoration. A support
 * channel is the one place a reader is invited to paste something private, and
 * the two things that must never be pasted there - a credential and a payment
 * detail - are worth naming on the page rather than only in a policy.
 *
 * Append protocol: add, never rename or remove.
 */
export const contact = {
  meta_title: 'Contact: how to send a message that can be answered',
  meta_description:
    'What to include in a support message, what never to send, and how this deployment configures the address a message goes to.',

  label_title: 'Contact',
  label_intro:
    'A message that can be answered in one reply has three parts: what you were doing, what you expected, and what happened instead. This page is about sending that message, and about what the platform does with it.',

  label_section_include_title: 'What to include',
  label_include_point_one:
    'The record you were working on, by its number or its reference, when the problem is about one record.',
  label_include_point_two:
    'The reference shown on an error, when there was one. It identifies the request in the log without identifying you.',
  label_include_point_three:
    'What you expected to happen and what happened instead. One sentence each is enough.',

  label_section_next_title: 'What happens to a message',
  label_next_point_one:
    'It becomes a ticket with a reference number, so a reply arrives against a record rather than inside an inbox thread.',
  label_next_point_two:
    'A ticket carries the account it came from, so an owner or an administrator can see the history for that workspace.',
  label_next_point_three:
    'The reply window is set with the queue. A response time is a commitment the business makes and keeps, not a sentence a page is free to choose.',

  label_section_never_title: 'What never goes in a message',
  label_never_point_one:
    'A password, a one-time code or a recovery phrase. Nobody who works on the platform will ask for one.',
  label_never_point_two:
    'Full payment details or bank credentials. Payment information belongs to the payment flow, never to a message.',

  label_note_address:
    'The address a message goes to, and the hours the queue is watched, are configured for this deployment by the business that runs it. Until they are configured, the pages below are the fastest way to see what the platform does.',

  action_features: 'See what the platform does',
  action_pricing: 'See what the plans cost',
  action_shortcuts: 'See the keyboard shortcuts',
} as const;
