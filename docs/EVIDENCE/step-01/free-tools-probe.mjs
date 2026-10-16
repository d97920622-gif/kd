// path: docs/EVIDENCE/step-01/free-tools-probe.mjs
/**
 * Sub-step 1.29 evidence: the free calculators, executed.
 *
 * This file is evidence, not part of the product. It runs the pure module
 * `lib/calculators/free-tools.ts` directly - no server, no browser - and prints
 * the figures it returns for a table of inputs a reader would type. It is
 * deliberately NOT wired into `npm run verify`: the project ships no test files
 * (Rule 4), and what belongs in the commit gate is the static half,
 * `scripts/checks/public-site.mjs`.
 *
 * Why the tool needs its own probe rather than a line in the page probe.
 * `docs/EVIDENCE/step-01/public-pages-probe.py` reads a running server over
 * HTTP and can therefore only see the markup a page ships: the calculator's
 * figures exist after a reader submits a form, which is a browser event. The
 * arithmetic itself is pure and runs anywhere, so it is executed here - and the
 * two halves together cover the whole path: this probe proves the numbers are
 * right for a table of inputs, and the page probe proves the tool is on the
 * page.
 *
 * What the table is for. A calculator is judged by the cases a reader will
 * actually hit: an amount with cents, an amount that rounds, a zero rate, a
 * rate with three decimals, the bounds the module declares, and the six inputs
 * it must refuse. Each row prints what the module returned, so a later step
 * comparing the product's own calculator against this one has the same table to
 * compare with.
 *
 * Usage: node --experimental-strip-types docs/EVIDENCE/step-01/free-tools-probe.mjs
 */
import {
  CALCULATOR_PERCENT_BOUNDS,
  CALCULATOR_TOOLS,
  calculate,
} from '../../../lib/calculators/free-tools.ts';

/** One row of the table: what a reader types and what must come back. */
const CASES = [
  { tool: 'markup', amount: '100', percent: '12.5', expect: ['$112.50', '$12.50'] },
  // A sub-cent input, kept because the rounding it exercises is the one the
  // product documents: half a cent rounds up, and the two lines of the card
  // are then rounded independently.
  { tool: 'markup', amount: '0.045', percent: '0', expect: ['$0.05', '$0.01'], centAligned: false },
  { tool: 'markup', amount: '0.03', percent: '33.333', expect: ['$0.04', '$0.01'] },
  { tool: 'markup', amount: '10', percent: '1000', expect: ['$110.00', '$100.00'] },
  { tool: 'discount', amount: '125.50', percent: '10', expect: ['$12.55', '$112.95'] },
  { tool: 'discount', amount: '9.99', percent: '0', expect: ['$0.00', '$9.99'] },
  { tool: 'discount', amount: '1.00', percent: '100', expect: ['$1.00', '$0.00'] },
  { tool: 'tax', amount: '99.99', percent: '7.5', expect: ['$7.50', '$107.49'] },
  { tool: 'tax', amount: '0.01', percent: '100', expect: ['$0.01', '$0.02'] },
  { tool: 'tax', amount: '1234.56', percent: '8.875', expect: ['$109.57', '$1,344.13'] },
];

/** Inputs the module must refuse, with the field and the reason it reports. */
const REFUSALS = [
  { tool: 'markup', amount: '', percent: '10', field: 'amount', problem: 'required' },
  { tool: 'markup', amount: '1e5', percent: '10', field: 'amount', problem: 'format' },
  { tool: 'markup', amount: '-5', percent: '10', field: 'amount', problem: 'range' },
  {
    tool: 'markup',
    amount: '123456789012345678',
    percent: '10',
    field: 'amount',
    problem: 'format',
  },
  { tool: 'tax', amount: '100', percent: '101', field: 'percent', problem: 'range' },
  { tool: 'tax', amount: '100', percent: '1000.0001', field: 'percent', problem: 'range' },
  { tool: 'discount', amount: '100', percent: '', field: 'percent', problem: 'required' },
  { tool: 'discount', amount: '100', percent: '1/2', field: 'percent', problem: 'format' },
];

/**
 * One line to the terminal.
 *
 * The probe writes to stdout directly rather than through `console`, because
 * `check:no-console` refuses console usage everywhere in this repository and a
 * probe that reported through the product's structured logger would be
 * reporting into a log nobody reads.
 */
function say(line) {
  process.stdout.write(`${line}\n`);
}

const findings = [];

/**
 * A money string as an integer number of cents.
 *
 * The probe does its own arithmetic on the strings the module returns rather
 * than on the inputs it was given, because what a reader checks is whether the
 * figures on the card add up. Two decimals are exact in binary up to a few
 * digits, and every figure in the table below is a cent value, so integer cents
 * is the whole arithmetic this file needs.
 */
function centsFrom(text) {
  return Math.round(Number(text.replaceAll('$', '').replaceAll(',', '')) * 100);
}

function line(message) {
  say(`  ${message}`);
}

say('free calculators, executed against lib/calculators/free-tools.ts');
say(`tools: ${CALCULATOR_TOOLS.join(', ')}`);
say(`percent bounds: ${JSON.stringify(CALCULATOR_PERCENT_BOUNDS)}`);
say('');

say('what a reader types, and what comes back:');
for (const row of CASES) {
  const outcome = calculate(row.tool, row.amount, row.percent);
  if (outcome.ok !== true) {
    findings.push(
      `${row.tool} ${row.amount} at ${row.percent}% was refused as ${outcome.field}/${outcome.problem}`,
    );
    line(`${row.tool.padEnd(8)} ${row.amount.padStart(10)} @ ${row.percent.padStart(7)}%  REFUSED`);
    continue;
  }
  const figures = outcome.figures.map((figure) => figure.value);
  const matches = figures[0] === row.expect[0] && figures[1] === row.expect[1];
  if (!matches) {
    findings.push(
      `${row.tool} ${row.amount} at ${row.percent}% returned ${figures.join(' / ')}, expected ${row.expect.join(' / ')}`,
    );
  }
  line(
    `${row.tool.padEnd(8)} ${row.amount.padStart(10)} @ ${row.percent.padStart(7)}%  ` +
      `${figures[0].padStart(10)}  ${figures[1].padStart(10)}  ${matches ? 'ok' : 'MISMATCH'}`,
  );
}
say('');

say('what the module refuses, and why:');
for (const row of REFUSALS) {
  const outcome = calculate(row.tool, row.amount, row.percent);
  const matches =
    outcome.ok === false && outcome.field === row.field && outcome.problem === row.problem;
  if (!matches) {
    findings.push(
      `${row.tool} ${row.amount} at ${row.percent}% was not refused as ${row.field}/${row.problem}`,
    );
  }
  line(
    `${row.tool.padEnd(8)} ${row.amount.padStart(10)} @ ${row.percent.padStart(7)}%  ` +
      `${outcome.ok === false ? `${outcome.field}/${outcome.problem}` : 'ACCEPTED'}  ${matches ? 'ok' : 'MISMATCH'}`,
  );
}
say('');

// The two lines of a card must add up to the input the reader typed: the
// profit, the saving and the tax are derived from the rounded figure rather than
// from the unrounded one, and this section is what catches the cent of drift - a
// card whose "$12.50" sits under a total that is one cent away from the sum of
// its own parts. The arithmetic here is on integer cents parsed out of the
// strings the module returned, because the probe compares what a reader sees.
say('the two lines of a card agree with the figure the reader typed:');
for (const row of CASES) {
  const outcome = calculate(row.tool, row.amount, row.percent);
  if (outcome.ok !== true) {
    continue;
  }
  const parts = outcome.figures.map((figure) => centsFrom(figure.value));
  const typed = centsFrom(row.amount);
  if (row.centAligned === false) {
    // The identity below is arithmetic on cents, and half a cent is not a cent
    // value: the typed figure rounds up and each line is rounded on its own, so
    // there is nothing for the lines to agree with. The rounding itself is
    // still checked by the table above.
    line(
      `${row.tool.padEnd(8)} ${row.amount.padStart(10)}  sub-cent input, the cent identity does not apply`,
    );
    continue;
  }
  // Each tool states its own identity, and it is the identity a reader checks
  // when they add the numbers up in their head: markup adds the profit to the
  // figure they typed to get the price, discount subtracts the saving from it
  // to get the final figure, and tax adds the tax to it - which is the total.
  const derived =
    row.tool === 'markup'
      ? typed + parts[1]
      : row.tool === 'discount'
        ? typed - parts[0]
        : typed + parts[0];
  const shown = row.tool === 'markup' ? parts[0] : parts[1];
  const matches = derived === shown;
  if (!matches) {
    findings.push(
      `${row.tool} ${row.amount} at ${row.percent}%: the two lines do not agree with the typed figure (${String(shown)} against ${String(derived)})`,
    );
  }
  line(
    `${row.tool.padEnd(8)} ${row.amount.padStart(10)}  shown ${String(shown).padStart(7)}  derived ${String(derived).padStart(7)} cents  ${matches ? 'ok' : 'MISMATCH'}`,
  );
}
say('');
say(`findings: ${findings.length}`);
for (const finding of findings) {
  say(`  FAIL ${finding}`);
}
say(`RESULT: ${findings.length === 0 ? 'PASS' : 'FAIL'}`);
process.exitCode = findings.length === 0 ? 0 : 1;
