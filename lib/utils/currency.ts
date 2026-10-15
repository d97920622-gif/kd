// path: lib/utils/currency.ts
// money-math-guard: sanctioned
/**
 * USD money utilities. This is the single money implementation of the
 * platform: no other file may define money helpers, parse money, format
 * money or perform monetary arithmetic (Rule 2, and the single-source rule
 * in docs/PLAN/03_FILE_OWNERSHIP_MATRIX.md).
 *
 * Rules enforced here:
 *   - Currency is USD only. The base currency code is validated with a Zod
 *     enum of one member; no other code may be stored or calculated.
 *   - Money is never a JavaScript number. Input is a decimal string or a
 *     Decimal value. A number is rejected with a ValidationError.
 *   - Storage scale is four decimals (numeric(18,4)). Serialization to the
 *     database always produces a four decimal string.
 *   - Rounding policy: ROUND_HALF_UP, applied at the storage scale of four
 *     decimals for amounts that are stored, and at the display scale of two
 *     decimals for amounts that are shown. Intermediate division keeps eight
 *     decimals and is rounded explicitly by the caller.
 *   - Magnitude is bounded by MAX_MONEY, the numeric(18,4) range.
 *
 * The module header carries the money-math guard annotation that
 * scripts/checks/money-math.mjs verifies in both directions.
 */
import Decimal from 'decimal.js';
import { z, type ZodEffects, type ZodString } from 'zod';

import { ValidationError } from '../errors/error-classes';

/** ISO 4217 code of the only supported base currency. */
export const USD_CODE = 'USD';

/** Symbol used by the display formatter. */
export const USD_SYMBOL = '$';

/** Storage scale: numeric(18,4) means four decimal places. */
export const USD_SCALE = 4;

/** Display scale for user-facing amounts: two decimal places. */
export const USD_DISPLAY_SCALE = 2;

/** Intermediate division scale, rounded explicitly afterwards. */
export const USD_DIVISION_SCALE = 8;

/** Total digits of numeric(18,4): fourteen integer digits plus four decimals. */
export const MAX_MONEY = new Decimal('99999999999999.9999');

/** Smallest positive unit of the storage scale. */
export const MONEY_UNIT = new Decimal('0.0001');

/** Smallest positive displayable unit, USD cent. */
export const MONEY_CENT = new Decimal('0.01');

/**
 * Decimal constructor with the money configuration. Cloned instead of
 * mutating the global Decimal configuration, so importing this module never
 * changes behaviour for another library.
 */
export const MoneyDecimal = Decimal.clone({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
});

export type Money = Decimal;
export type RoundingMode = Decimal.Rounding;

/** Decimal input shapes. A JavaScript number is deliberately not accepted. */
export type MoneyInput = string | Decimal;

/** Accepted textual money shapes: optional sign, up to 14 + 4 digits. */
export const MONEY_INPUT_PATTERN = /^[+-]?\d{1,14}(\.\d{1,4})?$/;

export interface ParseMoneyOptions {
  /** Allow a negative value. Default true. */
  readonly allowNegative?: boolean;
  /** Reject more than USD_SCALE decimals instead of rounding. Default false. */
  readonly strictScale?: boolean;
  /** Upper bound in absolute value. Default MAX_MONEY. */
  readonly max?: Decimal;
  /** Lower bound in absolute value for positive amounts. Default zero. */
  readonly min?: Decimal;
}

export interface MoneyFormatOptions {
  /** Decimal places to show. Default USD_DISPLAY_SCALE. */
  readonly scale?: number;
  /** Rounding used for display. Default ROUND_HALF_UP. */
  readonly rounding?: RoundingMode;
  /** Group the integer part with commas. Default true. */
  readonly grouping?: boolean;
  /** Prefix the currency symbol. Default true. */
  readonly symbol?: boolean;
}

const MAX_SCALE = 14;

function invalidMoney(message: string, input: string): ValidationError {
  return new ValidationError({
    code: 'money_invalid',
    details: [{ code: 'invalid_money', message }],
    internalMessage: `rejected money input (${input.length} chars): ${message}`,
  });
}

/** True when the value is a decimal string in an accepted money shape. */
export function isMoneyString(value: unknown): value is string {
  return typeof value === 'string' && MONEY_INPUT_PATTERN.test(value.trim());
}

function toMoneyDecimal(value: MoneyInput, options: ParseMoneyOptions): Money {
  const source = typeof value === 'string' ? value.trim() : value.toString();
  const parsed = typeof value === 'string' ? new MoneyDecimal(source) : new MoneyDecimal(value);
  if (parsed.isNaN()) {
    throw invalidMoney('The amount is not a valid decimal number.', source);
  }
  if (!parsed.isFinite()) {
    throw invalidMoney('The amount must be a finite number.', source);
  }
  const scale = typeof value === 'string' ? decimalPlacesOf(source) : parsed.decimalPlaces();
  if (scale > MAX_SCALE) {
    throw invalidMoney(`The amount has more than ${MAX_SCALE} decimal places.`, source);
  }
  if (options.strictScale === true && scale > USD_SCALE) {
    throw invalidMoney(`The amount has more than ${USD_SCALE} decimal places.`, source);
  }
  const rounded = parsed.toDP(USD_SCALE, Decimal.ROUND_HALF_UP);
  const bound = options.max ?? MAX_MONEY;
  if (rounded.abs().greaterThan(bound)) {
    throw invalidMoney('The amount is outside the supported range.', source);
  }
  const negativeAllowed = options.allowNegative ?? true;
  if (!negativeAllowed && rounded.isNegative()) {
    throw invalidMoney('The amount must not be negative.', source);
  }
  if (options.min !== undefined && rounded.lessThan(options.min)) {
    throw invalidMoney('The amount is below the allowed minimum.', source);
  }
  return rounded;
}

function decimalPlacesOf(source: string): number {
  const dot = source.indexOf('.');
  if (dot < 0) {
    return 0;
  }
  return source.length - dot - 1;
}

/**
 * Parse a money input into a Decimal at the storage scale of four decimals.
 *
 * A JavaScript number input throws: passing a number is the defect this
 * module exists to prevent. A string is validated, bounded and rounded
 * HALF_UP to four decimals.
 *
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function parseMoney(value: MoneyInput, options: ParseMoneyOptions = {}): Money {
  if (typeof value === 'number' || (typeof value !== 'string' && !(value instanceof Decimal))) {
    throw invalidMoney(
      'Money must be passed as a decimal string or a Decimal value.',
      typeof value,
    );
  }
  return toMoneyDecimal(value, options);
}

/** Parse money or return null instead of throwing, for optional fields. */
export function parseMoneyOrNull(
  value: MoneyInput | null | undefined,
  options: ParseMoneyOptions = {},
): Money | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  try {
    return parseMoney(value, options);
  } catch {
    return null;
  }
}

/** Normalize any accepted input to the storage scale without validation gaps. */
export function toMoney(value: MoneyInput): Money {
  return toMoneyDecimal(value, {});
}

/** Round to a scale with an explicit rounding mode. */
export function roundMoney(
  value: MoneyInput,
  scale: number = USD_SCALE,
  rounding: RoundingMode = Decimal.ROUND_HALF_UP,
): Money {
  if (!Number.isInteger(scale) || scale < 0 || scale > MAX_SCALE) {
    throw invalidMoney(`Scale must be an integer between 0 and ${MAX_SCALE}.`, String(scale));
  }
  return toMoney(value).toDP(scale, rounding);
}

/** Round to the display scale, cent precision. */
export function roundToCents(value: MoneyInput): Money {
  return roundMoney(value, USD_DISPLAY_SCALE, Decimal.ROUND_HALF_UP);
}

/**
 * Serialize money for storage in a numeric(18,4) column.
 * Always four decimals, never exponent notation.
 *
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function toStorageString(value: MoneyInput): string {
  return roundMoney(value, USD_SCALE).toFixed(USD_SCALE);
}

/**
 * Exact addition ((a + b) at storage scale).
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function addMoney(a: MoneyInput, b: MoneyInput): Money {
  return toMoney(a).plus(toMoney(b)).toDP(USD_SCALE, Decimal.ROUND_HALF_UP);
}

/**
 * Exact subtraction (a - b) at storage scale.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function subtractMoney(a: MoneyInput, b: MoneyInput): Money {
  return toMoney(a).minus(toMoney(b)).toDP(USD_SCALE, Decimal.ROUND_HALF_UP);
}

/**
 * Multiply an amount by a decimal factor (quantity or rate), rounded HALF_UP
 * at storage scale.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function multiplyMoney(
  amount: MoneyInput,
  factor: MoneyInput,
  options: { readonly scale?: number; readonly rounding?: RoundingMode } = {},
): Money {
  const scale = options.scale ?? USD_SCALE;
  const product = toMoney(amount).times(toMoney(factor));
  return product.toDP(scale, options.rounding ?? Decimal.ROUND_HALF_UP);
}

/**
 * Divide an amount by a non-zero decimal divisor. The default scale is the
 * division scale of eight decimals; callers round explicitly afterwards.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function divideMoney(
  amount: MoneyInput,
  divisor: MoneyInput,
  options: { readonly scale?: number; readonly rounding?: RoundingMode } = {},
): Money {
  const denominator = toMoney(divisor);
  if (denominator.isZero()) {
    throw new ValidationError({
      code: 'money_division_by_zero',
      details: [{ code: 'division_by_zero', message: 'The divisor must not be zero.' }],
      internalMessage: 'money division by zero',
    });
  }
  const scale = options.scale ?? USD_DIVISION_SCALE;
  const quotient = toMoney(amount).div(denominator);
  return quotient.toDP(scale, options.rounding ?? Decimal.ROUND_HALF_UP);
}

/**
 * Sum a list of amounts exactly, at storage scale.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function sumMoney(values: readonly MoneyInput[]): Money {
  let accumulator = new MoneyDecimal(0);
  for (const value of values) {
    accumulator = accumulator.plus(toMoney(value));
  }
  return accumulator.toDP(USD_SCALE, Decimal.ROUND_HALF_UP);
}

/**
 * Apply a decimal rate to an amount, for example tax at 0.075.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function applyRate(
  amount: MoneyInput,
  rate: MoneyInput,
  options: { readonly scale?: number; readonly rounding?: RoundingMode } = {},
): Money {
  return multiplyMoney(amount, rate, options);
}

/**
 * Split an amount into shares proportional to integer weights without losing
 * or inventing a single unit (largest remainder method). Weights are counts,
 * never money: the caller passes [2, 1, 1], not [50, 25, 25].
 *
 * The returned shares always sum exactly to the rounded total.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function allocateMoney(total: MoneyInput, weights: readonly number[]): Money[] {
  if (weights.length === 0) {
    throw new ValidationError({
      code: 'money_allocation_empty',
      details: [{ code: 'empty_weights', message: 'At least one share is required.' }],
      internalMessage: 'money allocation called without weights',
    });
  }
  let weightSum = 0;
  for (const weight of weights) {
    if (!Number.isInteger(weight) || weight < 0) {
      throw new ValidationError({
        code: 'money_allocation_invalid_weight',
        details: [{ code: 'invalid_weight', message: 'Share weights must be whole numbers.' }],
        internalMessage: 'money allocation received a non-integer weight',
      });
    }
    weightSum += weight;
  }
  if (weightSum === 0) {
    throw new ValidationError({
      code: 'money_allocation_zero_weight',
      details: [{ code: 'zero_weight', message: 'Share weights must not all be zero.' }],
      internalMessage: 'money allocation received zero total weight',
    });
  }
  const units = roundMoney(total, USD_SCALE).times(new MoneyDecimal(10000)).toDP(0);
  const shares: Decimal[] = [];
  let assigned = new MoneyDecimal(0);
  for (const weight of weights) {
    const exact = units.times(weight).div(weightSum);
    const floor = exact.toDP(0, Decimal.ROUND_DOWN);
    shares.push(floor);
    assigned = assigned.plus(floor);
  }
  let remaining = units.minus(assigned).toNumber();
  const order = weights
    .map((weight, index) => ({ index, weight }))
    .sort((left, right) => right.weight - left.weight || left.index - right.index);
  let cursor = 0;
  while (remaining > 0 && order.length > 0) {
    const target = order[cursor % order.length];
    shares[target.index] = shares[target.index].plus(1);
    remaining -= 1;
    cursor += 1;
  }
  return shares.map((share) => share.div(new MoneyDecimal(10000)).toDP(USD_SCALE));
}

/** Compare two amounts: -1 when a is smaller, 0 when equal, 1 when larger. */
export function compareMoney(a: MoneyInput, b: MoneyInput): -1 | 0 | 1 {
  const left = roundMoney(a, USD_SCALE);
  const right = roundMoney(b, USD_SCALE);
  if (left.lessThan(right)) {
    return -1;
  }
  if (left.greaterThan(right)) {
    return 1;
  }
  return 0;
}

/** True when both amounts are equal at storage scale. */
export function equalMoney(a: MoneyInput, b: MoneyInput): boolean {
  return compareMoney(a, b) === 0;
}

/** True when the amount is exactly zero at storage scale. */
export function isZeroMoney(value: MoneyInput): boolean {
  return roundMoney(value, USD_SCALE).isZero();
}

/** True when the amount is negative at storage scale. */
export function isNegativeMoney(value: MoneyInput): boolean {
  return roundMoney(value, USD_SCALE).isNegative();
}

/** True when the amount is greater than zero at storage scale. */
export function isPositiveMoney(value: MoneyInput): boolean {
  return roundMoney(value, USD_SCALE).isPositive();
}

/** Negate an amount. */
export function negateMoney(value: MoneyInput): Money {
  return roundMoney(value, USD_SCALE).negated();
}

/** Absolute value of an amount, for statement and report display. */
export function absoluteMoney(value: MoneyInput): Money {
  return roundMoney(value, USD_SCALE).abs();
}

/** Smaller of two amounts. */
export function minMoney(a: MoneyInput, b: MoneyInput): Money {
  return compareMoney(a, b) <= 0 ? roundMoney(a, USD_SCALE) : roundMoney(b, USD_SCALE);
}

/** Larger of two amounts. */
export function maxMoney(a: MoneyInput, b: MoneyInput): Money {
  return compareMoney(a, b) >= 0 ? roundMoney(a, USD_SCALE) : roundMoney(b, USD_SCALE);
}

function groupDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function renderMoney(value: MoneyInput, options: MoneyFormatOptions): string {
  const scale = options.scale ?? USD_DISPLAY_SCALE;
  const rounding = options.rounding ?? Decimal.ROUND_HALF_UP;
  const rounded = roundMoney(value, scale, rounding);
  // An amount that rounds to zero at display scale shows as zero, without a
  // leading minus sign: -0.004 displays as $0.00, never as -$0.00.
  const negative = rounded.isNegative() && !rounded.isZero();
  const absolute = rounded.abs().toFixed(scale);
  const dot = absolute.indexOf('.');
  const integerPart = dot < 0 ? absolute : absolute.slice(0, dot);
  const fractionPart = dot < 0 ? '' : absolute.slice(dot);
  const grouped = options.grouping === false ? integerPart : groupDigits(integerPart);
  const symbol = options.symbol === false ? '' : USD_SYMBOL;
  return `${negative ? '-' : ''}${symbol}${grouped}${fractionPart}`;
}

/**
 * Format money for display: "$1,234.56" and "-$9.05".
 * String based, so no amount ever passes through a JavaScript number.
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function formatMoney(value: MoneyInput, options: MoneyFormatOptions = {}): string {
  return renderMoney(value, options);
}

/**
 * Format money without the symbol and without grouping, for CSV, PDF and
 * machine-readable exports: "1234.56".
 * @moneyMathGuard sanctioned: this module is the single money implementation.
 */
export function formatMoneyPlain(value: MoneyInput, options: MoneyFormatOptions = {}): string {
  return renderMoney(value, { grouping: false, symbol: false, ...options });
}

/** Zod schema for the only supported base currency code. */
export const usdCurrencySchema = z.enum([USD_CODE], {
  errorMap: () => ({ message: `${USD_CODE} is the only supported base currency.` }),
});

/**
 * Zod schema that validates and parses a money string in one step. The
 * output is a Decimal at storage scale, never a number.
 */
export function moneySchema(options: ParseMoneyOptions = {}): ZodEffects<ZodString, Money, string> {
  return z
    .string()
    .trim()
    .min(1, { message: 'An amount is required.' })
    .regex(MONEY_INPUT_PATTERN, {
      message: 'Enter a USD amount with up to four decimal places.',
    })
    .transform((value, ctx) => {
      try {
        return parseMoney(value, options);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof ValidationError && error.details.length > 0
              ? error.details[0].message
              : 'Enter a valid USD amount.',
        });
        return z.NEVER;
      }
    });
}

/** Zod schema for an amount that must not be zero. */
export function positiveMoneySchema(
  options: ParseMoneyOptions = {},
): ZodEffects<ZodString, Money, string> {
  return z
    .string()
    .trim()
    .min(1, { message: 'An amount is required.' })
    .regex(MONEY_INPUT_PATTERN, {
      message: 'Enter a USD amount with up to four decimal places.',
    })
    .transform((value, ctx) => {
      try {
        const parsed = parseMoney(value, options);
        if (parsed.lessThanOrEqualTo(0)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'The amount must be greater than 0.00.',
          });
          return z.NEVER;
        }
        return parsed;
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            error instanceof ValidationError && error.details.length > 0
              ? error.details[0].message
              : 'Enter a valid USD amount.',
        });
        return z.NEVER;
      }
    });
}

/** True when the two currency codes are the same supported base currency. */
export function isSupportedCurrency(code: string): boolean {
  return code.toUpperCase() === USD_CODE;
}
