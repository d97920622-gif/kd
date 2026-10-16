// path: lib/i18n/strings/en/offline.ts
/**
 * Copy for the offline page (FEATURE_LIST item 3581, the browser fallback).
 *
 * The temptation on a page like this is to promise a product that works
 * offline, and this build does not have one: caching pages and requests is the
 * browser half of the installable app, and `public/sw.js` belongs to step 16.
 * So the page states what is true today - a page already open still reads, an
 * edit in a form is kept in this browser, a failed operation is the reader's to
 * retry - and then says in one sentence that this page is text rather than a
 * cached copy of the product.
 *
 * That is the same rule the rest of the public site follows: describe what the
 * build does, and name the part that is not here yet rather than implying it.
 *
 * Append protocol: add, never rename or remove.
 */
export const offline = {
  meta_title: 'Offline: what the platform does without a connection',
  meta_description:
    'What still works when the connection drops, what is kept in this browser, and what to do when the line returns.',

  label_title: 'The connection dropped',
  label_intro:
    'A page a request lands on when the network is gone. It says what still works, what happens to work that was in progress, and what to do when the line returns.',

  label_section_works_title: 'What still works',
  label_works_point_one:
    'A page that is already open still reads, because the browser already has it.',
  label_works_point_two:
    'A form keeps what was typed into it in this browser, so a dropped connection does not lose an edit.',
  label_works_point_three:
    'An operation that failed is yours to retry, and the platform reports whether the record was saved before the line went.',

  label_section_next_title: 'When the line returns',
  label_next_point_one:
    'Reload the page, or follow a link: the connection banner clears itself as soon as the browser reports the network again.',
  label_next_point_two:
    'A kept draft is offered back the next time the form is opened, with the choice to use it or discard it.',

  label_note_scope:
    'This page is text, not a cached copy of the product. Caching the product for offline reading is the browser half of the installable app, and until that exists, this page is what can be promised honestly.',

  action_home: 'Go to the homepage',
  action_features: 'See what the platform does',
} as const;
