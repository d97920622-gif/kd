// path: components/public/free-calculator.tsx
'use client';

import { useState } from 'react';

import { FormField } from '@/components/shared/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  calculate,
  type CalculatorField,
  type CalculatorFigureId,
  type CalculatorProblem,
  type CalculatorSuccess,
  type CalculatorTool,
} from '@/lib/calculators/free-tools';
import { t, type EnglishStringKey } from '@/lib/i18n';

/**
 * One free calculator, as a form.
 *
 * The whole point of this component is that it holds no arithmetic. It reads
 * two strings, hands them to `lib/calculators/free-tools.ts`, and renders
 * whatever comes back: either figures already formatted in US dollars, or the
 * field that was refused with a problem code. That split is what lets the
 * numbers be proved in Node (`docs/EVIDENCE/step-01/free-tools-probe.mjs`)
 * while the page keeps a client boundary of its own.
 *
 * Four decisions:
 *
 *   1. **Nothing is calculated while the reader types.** A result that changes
 *      on every keystroke is a result nobody asked for yet, and it makes the
 *      live region announce three times on the way to a single answer. The
 *      reader submits, and one answer arrives.
 *   2. **The answer is announced once, in a status region.** The figures are
 *      rendered inside a polite live region, so a screen reader hears the
 *      result of the calculation it just asked for, and hears it once.
 *   3. **A refusal points at the field it belongs to.** The problem code from
 *      the pure module is mapped to a sentence and passed to `FormField`, which
 *      owns the `aria-invalid` and `aria-describedby` wiring: a message that is
 *      not attached to its input is a message a screen reader never reads.
 *   4. **The previous answer is withdrawn when an input is refused.** Leaving
 *      the last figures on screen under a corrected input is how a reader
 *      copies a number that never applied to what they typed.
 */
export interface FreeCalculatorProps {
  readonly tool: CalculatorTool;
}

/** Label for each computed figure. Typed, so a new figure id fails the build. */
const FIGURE_LABEL_KEYS: Record<CalculatorFigureId, EnglishStringKey> = {
  price: 'calculators.label_figure_price',
  profit: 'calculators.label_figure_profit',
  saved: 'calculators.label_figure_saved',
  final: 'calculators.label_figure_final',
  tax: 'calculators.label_figure_tax',
  total: 'calculators.label_figure_total',
};

/** Label for each field, per tool: the same control asks different questions. */
const FIELD_LABEL_KEYS: Record<
  CalculatorTool,
  { readonly amount: EnglishStringKey; readonly percent: EnglishStringKey }
> = {
  markup: {
    amount: 'calculators.label_field_amount_markup',
    percent: 'calculators.label_field_percent_markup',
  },
  discount: {
    amount: 'calculators.label_field_amount_discount',
    percent: 'calculators.label_field_percent_discount',
  },
  tax: {
    amount: 'calculators.label_field_amount_tax',
    percent: 'calculators.label_field_percent_tax',
  },
};

const PROBLEM_LABEL_KEYS: Record<CalculatorProblem, Record<CalculatorField, EnglishStringKey>> = {
  required: {
    amount: 'calculators.label_problem_amount_required',
    percent: 'calculators.label_problem_percent_required',
  },
  format: {
    amount: 'calculators.label_problem_amount_format',
    percent: 'calculators.label_problem_percent_format',
  },
  range: {
    amount: 'calculators.label_problem_amount_range',
    percent: 'calculators.label_problem_percent_range',
  },
};

export function FreeCalculator({ tool }: FreeCalculatorProps): React.ReactElement {
  const [amount, setAmount] = useState('');
  const [percent, setPercent] = useState('');
  const [outcome, setOutcome] = useState<CalculatorSuccess | null>(null);
  const [errors, setErrors] = useState<Partial<Record<CalculatorField, EnglishStringKey>>>({});

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const result = calculate(tool, amount, percent);
    if (result.ok) {
      setErrors({});
      setOutcome(result);
      return;
    }
    setOutcome(null);
    setErrors({ [result.field]: PROBLEM_LABEL_KEYS[result.problem][result.field] });
  };

  const labels = FIELD_LABEL_KEYS[tool];

  return (
    <form
      onSubmit={onSubmit}
      noValidate={false}
      data-tool={tool}
      data-tool-status={outcome === null ? 'idle' : 'ready'}
      className="grid gap-4 rounded-md border border-border bg-card p-6"
    >
      <FormField
        label={t(labels.amount)}
        description={t('calculators.label_field_amount_hint')}
        error={errors.amount === undefined ? undefined : t(errors.amount)}
        required={true}
      >
        <Input
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </FormField>

      <FormField
        label={t(labels.percent)}
        description={t('calculators.label_field_percent_hint')}
        error={errors.percent === undefined ? undefined : t(errors.percent)}
        required={true}
      >
        <Input
          inputMode="decimal"
          autoComplete="off"
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
        />
      </FormField>

      <div>
        <Button type="submit">{t('calculators.action_calculate')}</Button>
      </div>

      {outcome === null ? null : (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="grid gap-2 rounded-md border border-border bg-muted p-4"
        >
          <dl className="grid gap-2">
            {outcome.figures.map((figure) => (
              <div key={figure.id} className="flex flex-wrap items-baseline justify-between gap-3">
                <dt className="text-sm text-muted-foreground">{t(FIGURE_LABEL_KEYS[figure.id])}</dt>
                <dd data-tool-figure={figure.id} className="text-xl font-semibold tracking-tight">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </form>
  );
}
