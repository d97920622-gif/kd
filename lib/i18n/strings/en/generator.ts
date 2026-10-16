// path: lib/i18n/strings/en/generator.ts
/**
 * Copy for the free invoice generator page (FEATURE_LIST item 254).
 *
 * The page is a shell, and the copy says so in its own words rather than
 * pretending otherwise: it describes what the tool asks for, what it produces
 * and the rules it follows, and it states that the tool itself is not on the
 * page yet. That is the honest shape for a lead magnet whose arithmetic and
 * numbering belong to the invoicing module - an invoice number is a sequence
 * the workspace owns, and a public tool that invented one would be a second
 * answer to how documents are numbered.
 *
 * The reader is not left with nothing: the calculators work today, and the page
 * links to them, because a tool page that ends in an apology wastes the visit
 * that brought the reader here.
 *
 * Append protocol: add, never rename or remove.
 */
export const generator = {
  meta_title: 'Free invoice generator: what it asks for and produces',
  meta_description:
    'What the free invoice generator will ask for, what it will produce, and the rules it follows: no account, nothing stored, US dollars.',

  label_title: 'Free invoice generator',
  label_intro:
    'The one tool on this site meant to do a whole job without an account: an invoice, numbered and totalled, ready to send. This page is what the tool is specified against.',

  label_section_asks_title: 'What it asks for',
  label_asks_point_one: 'Your business name and the details you want printed on the document.',
  label_asks_point_two:
    'The client name and address, exactly as they should appear on the invoice.',
  label_asks_point_three:
    'The lines: a description, a quantity, a unit price and a tax rate for each one.',
  label_asks_point_four:
    'An invoice number and a due date, or the numbering rule you want the tool to follow.',

  label_section_gives_title: 'What it produces',
  label_gives_point_one:
    'An invoice with a number, a date, a due date, subtotals, tax and a total, in US dollars.',
  label_gives_point_two:
    'A document you can print or save as a PDF from the browser, with no account and no copy kept on the platform.',
  label_gives_point_three:
    'The rounding rule the product uses everywhere: to the nearest cent, with a half cent rounded up.',

  label_section_rules_title: 'The rules it follows',
  label_rule_no_account:
    'No account, no email address, no sign-up. A tool that asks a stranger for an account before it does anything is not a free tool.',
  label_rule_one_currency:
    'US dollars. The platform keeps one currency, and a document that mixes currencies cannot be totalled honestly.',
  label_rule_nothing_stored:
    'Nothing is stored on the platform. The invoice lives in the browser tab and in the file you save from it.',

  label_note_status:
    'The generator itself is not on this page yet: the tool is built on the invoicing module, which owns how a document is numbered and totalled. What is written above is the specification it is built against.',

  action_calculators: 'Use the free calculators',
  action_features: 'See what the platform does',
} as const;
