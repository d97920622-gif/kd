// path: lib/calculators/free-tools.ts
/**
 * The three free calculators, decided in one place.
 *
 * FEATURE_LIST item 255 asks for free calculator tools (markup, discount, tax)
 * as lead magnets, and docs/PLAN/08 places them in sub-step 1.29. A free tool
 * on a public page is judged in one pass: the reader types two numbers and
 * either trusts the answer or closes the tab. So the arithmetic is not here as
 * a convenience - it is here so that the answer can be proved without a
 * browser, in `docs/EVIDENCE/step-01/free-tools-probe.mjs`, against the same
 * functions the page calls.
 *
 * Four decisions:
 *
 *   1. **The arithmetic belongs to the money module.** Every figure is computed
 *      through `lib/utils/currency.ts`: this module adds, subtracts and applies
 *      a rate, and it performs no arithmetic of its own. That is what makes the
 *      answers exact decimals rather than binary floating point, and it is the
 *      difference between a rounded half cent going up and going down.
 *   2. **A percentage is not a rate.** The reader types 7.5, the arithmetic
 *      needs 0.075, and the conversion happens once, in the money module. A
 *      calculator that divides by a hundred itself is the place the factor of a
 *      hundred gets lost.
 *   3. **Every refusal names the field it belongs to.** The outcome is either
 *      figures or a field and a problem code, never a sentence: the page maps
 *      the code to catalogue copy, so this module stays free of display text and
 *      of any opinion about which sentence fits.
 *   4. **The bounds are stated, not discovered.** A discount above 100 percent
 *      and a negative amount are refused with a range problem rather than
 *      quietly producing a negative total, and a markup is bounded at 1000
 *      percent, which is high enough for a reseller and low enough that a
 *      mistyped figure is caught rather than multiplied.
 */
import {
  type Money,
  addMoney,
  applyRate,
  compareMoney,
  formatMoney,
  isMoneyString,
  parseMoney,
  percentToRate,
  roundToCents,
  subtractMoney,
} from '../utils/currency.ts';

/** The three tools, in the order the page offers them. */
export const CALCULATOR_TOOLS = ['markup', 'discount', 'tax'] as const;
export type CalculatorTool = (typeof CALCULATOR_TOOLS)[number];

/** The two inputs every tool takes: an amount and a percentage. */
export type CalculatorField = 'amount' | 'percent';

/** What can be wrong with an input, as a code the page turns into copy. */
export type CalculatorProblem = 'required' | 'format' | 'range';

/** One computed line, identified so the page can label it. */
export type CalculatorFigureId = 'price' | 'profit' | 'saved' | 'final' | 'tax' | 'total';

export interface CalculatorFigure {
  readonly id: CalculatorFigureId;
  /** Formatted USD, from the money formatter: "$112.50". */
  readonly value: string;
}

/** What a tool returns when the inputs are figures it can work with. */
export interface CalculatorSuccess {
  readonly ok: true;
  readonly figures: readonly CalculatorFigure[];
}

/** What a tool returns when one input is refused, and which one it was. */
export interface CalculatorFailure {
  readonly ok: false;
  readonly field: CalculatorField;
  readonly problem: CalculatorProblem;
}

export type CalculatorOutcome = CalculatorSuccess | CalculatorFailure;

/**
 * The highest percentage each tool accepts.
 *
 * A markup above 100 percent is ordinary trade, so its bound exists only to
 * catch a mistyped figure. A discount or a tax above 100 percent is not a
 * figure, it is a mistake, and the tool says so instead of computing it.
 */
export const CALCULATOR_PERCENT_BOUNDS: Record<CalculatorTool, string> = {
  markup: '1000',
  discount: '100',
  tax: '100',
};

function readAmount(input: string): { readonly ok: true; readonly value: Money } | Failed {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, problem: 'required' };
  }
  if (!isMoneyString(trimmed)) {
    return { ok: false, problem: 'format' };
  }
  try {
    return { ok: true, value: parseMoney(trimmed, { allowNegative: false }) };
  } catch {
    // The string has the shape of an amount but not the range: too many
    // decimals, or beyond the numeric(18,4) bound the database holds.
    return { ok: false, problem: 'range' };
  }
}

function readPercent(
  input: string,
  maxPercent: string,
): { readonly ok: true; readonly rate: Money } | Failed {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { ok: false, problem: 'required' };
  }
  if (!isMoneyString(trimmed)) {
    return { ok: false, problem: 'format' };
  }
  let asPercent: Money;
  try {
    asPercent = parseMoney(trimmed, { allowNegative: false });
  } catch {
    return { ok: false, problem: 'range' };
  }
  if (compareMoney(asPercent, maxPercent) > 0) {
    return { ok: false, problem: 'range' };
  }
  return { ok: true, rate: percentToRate(asPercent) };
}

interface Failed {
  readonly ok: false;
  readonly problem: CalculatorProblem;
}

function failed(field: CalculatorField, problem: CalculatorProblem): CalculatorFailure {
  return { ok: false, field, problem };
}

function figures(...lines: readonly (readonly [CalculatorFigureId, Money])[]): CalculatorSuccess {
  return {
    ok: true,
    figures: lines.map(([id, value]) => ({ id, value: formatMoney(roundToCents(value)) })),
  };
}

/**
 * Markup: what to charge for something that cost a known amount.
 *
 * The price is the cost plus the markup the reader asked for, and the profit
 * line is the difference between the two rounded figures rather than the
 * unrounded markup, so the two lines on the page add up to each other.
 */
export function calculateMarkup(costInput: string, markupInput: string): CalculatorOutcome {
  const cost = readAmount(costInput);
  if (!cost.ok) {
    return failed('amount', cost.problem);
  }
  const markup = readPercent(markupInput, CALCULATOR_PERCENT_BOUNDS.markup);
  if (!markup.ok) {
    return failed('percent', markup.problem);
  }
  const price = roundToCents(addMoney(cost.value, applyRate(cost.value, markup.rate)));
  return figures(['price', price], ['profit', roundToCents(subtractMoney(price, cost.value))]);
}

/** Discount: what a reader pays after a percentage comes off a price. */
export function calculateDiscount(priceInput: string, discountInput: string): CalculatorOutcome {
  const price = readAmount(priceInput);
  if (!price.ok) {
    return failed('amount', price.problem);
  }
  const discount = readPercent(discountInput, CALCULATOR_PERCENT_BOUNDS.discount);
  if (!discount.ok) {
    return failed('percent', discount.problem);
  }
  const saved = roundToCents(applyRate(price.value, discount.rate));
  return figures(['saved', saved], ['final', roundToCents(subtractMoney(price.value, saved))]);
}

/** Tax: the amount added on top of a subtotal, and the total to charge. */
export function calculateTax(subtotalInput: string, taxInput: string): CalculatorOutcome {
  const subtotal = readAmount(subtotalInput);
  if (!subtotal.ok) {
    return failed('amount', subtotal.problem);
  }
  const tax = readPercent(taxInput, CALCULATOR_PERCENT_BOUNDS.tax);
  if (!tax.ok) {
    return failed('percent', tax.problem);
  }
  const taxFigure = roundToCents(applyRate(subtotal.value, tax.rate));
  return figures(['tax', taxFigure], ['total', roundToCents(addMoney(subtotal.value, taxFigure))]);
}

/** The dispatcher the page uses, so one component serves all three tools. */
export function calculate(
  tool: CalculatorTool,
  amountInput: string,
  percentInput: string,
): CalculatorOutcome {
  switch (tool) {
    case 'markup':
      return calculateMarkup(amountInput, percentInput);
    case 'discount':
      return calculateDiscount(amountInput, percentInput);
    case 'tax':
      return calculateTax(amountInput, percentInput);
  }
}
