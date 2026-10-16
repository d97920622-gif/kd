// path: lib/i18n/strings/en/calculators.ts
/**
 * Copy for the three free calculators (FEATURE_LIST item 255).
 *
 * The page is a public tool, and the copy has one job beyond explaining the
 * fields: to say what the figures are and what they are not. A reader who
 * arrives from a search result has no reason to trust an unfamiliar page, so
 * the rules section states the currency, the rounding rule and the fact that
 * nothing is stored - all three of which are true of the arithmetic in
 * `lib/calculators/free-tools.ts` and can be checked against it.
 *
 * The field labels are written per tool rather than shared, because "Price" on
 * a discount tool and "Price to charge" on a markup tool are different
 * questions: one is what the item already costs the reader's client, the other
 * is what the reader should charge.
 *
 * Append protocol: add, never rename or remove.
 */
export const calculators = {
  meta_title: 'Free calculators: markup, discount and tax in US dollars',
  meta_description:
    'Three free tools that work out a selling price, a discount and the tax on a subtotal, in US dollars, with the rounding rule stated.',

  label_title: 'Free calculators',
  label_intro:
    'Three figures a small business needs every week: what to charge, what a discount leaves behind, and what tax adds to a subtotal. Nothing you type is stored and nothing is sent anywhere.',

  label_section_tools_title: 'The three tools',
  label_tool_markup_title: 'Markup',
  label_tool_markup_body:
    'Enter what an item cost you and the markup you want, and read the price to charge.',
  label_tool_discount_title: 'Discount',
  label_tool_discount_body:
    'Enter a price and a discount, and read what the client pays and what the discount costs you.',
  label_tool_tax_title: 'Tax',
  label_tool_tax_body:
    'Enter a subtotal and a rate, and read the tax on top and the total to charge.',

  label_field_amount_markup: 'What it cost you',
  label_field_amount_discount: 'Price before the discount',
  label_field_amount_tax: 'Subtotal',
  label_field_amount_hint: 'US dollars, up to four decimal places.',
  label_field_percent_markup: 'Markup percent',
  label_field_percent_discount: 'Discount percent',
  label_field_percent_tax: 'Tax percent',
  label_field_percent_hint: 'A percentage, such as 12.5.',

  action_calculate: 'Calculate',

  label_figure_price: 'Price to charge',
  label_figure_profit: 'Profit',
  label_figure_saved: 'Discount',
  label_figure_final: 'Client pays',
  label_figure_tax: 'Tax',
  label_figure_total: 'Total to charge',

  label_problem_amount_required: 'Enter an amount.',
  label_problem_amount_format: 'Enter an amount in digits, such as 125.50.',
  label_problem_amount_range: 'Enter an amount within the range this tool supports.',
  label_problem_percent_required: 'Enter a percentage.',
  label_problem_percent_format: 'Enter a percentage in digits, such as 12.5.',
  label_problem_percent_range: 'Enter a percentage within the range this tool supports.',

  label_rules_title: 'How the figures are worked out',
  label_rule_currency:
    'Every amount is in US dollars. The platform keeps one currency, so a figure from these tools is the figure an invoice would carry.',
  label_rule_rounding:
    'Figures are rounded to the nearest cent, with a half cent rounded up, which is the rule the invoicing module uses when it totals a document.',
  label_rule_decimal:
    'The arithmetic runs on decimal values, not on binary floating point, so a half cent cannot land on the wrong side of the rounding.',
  label_rule_nothing_stored:
    'Nothing you type is stored or sent. The figures appear on this page and are gone when you leave it.',

  label_note_reuse:
    'The invoicing module applies these same rules to a document, which is why the tools are here rather than on a marketing page of their own.',

  action_pricing: 'See what the plans cost',
  action_features: 'See what the platform does',
} as const;
