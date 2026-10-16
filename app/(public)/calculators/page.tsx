// path: app/(public)/calculators/page.tsx
import Link from 'next/link';

import { FreeCalculator } from '@/components/public/free-calculator';
import { Button } from '@/components/ui/button';
import { CALCULATOR_TOOLS, type CalculatorTool } from '@/lib/calculators/free-tools';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The free calculators page (FEATURE_LIST item 255: markup, discount, tax).
 *
 * The page is a tool, so it is built like one: three forms, each with two
 * fields and one submit, and a rules section underneath that states what the
 * figures are. The forms are client components; this page is a server
 * component with metadata like every other public page, and it contributes no
 * arithmetic of its own - the numbers come from
 * `lib/calculators/free-tools.ts` through `FreeCalculator`.
 *
 * Why the rules are on the page rather than in a footnote: a reader who arrived
 * from a search result is being asked to trust a number they did not compute,
 * and the three things that make it trustworthy are the currency, the rounding
 * rule and the fact that nothing typed here is stored. All three are true of
 * the implementation, which is the only reason they are allowed to be printed.
 *
 * The two closing links exist because a tool page is a page a stranger lands
 * on: the reader who has just used a calculator is the reader most likely to
 * ask what the product costs.
 */
export const metadata: Metadata = {
  title: t('calculators.meta_title'),
  description: t('calculators.meta_description'),
  openGraph: {
    type: 'website',
    title: t('calculators.meta_title'),
    description: t('calculators.meta_description'),
  },
};

interface ToolCopy {
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
}

const TOOL_COPY: Record<CalculatorTool, ToolCopy> = {
  markup: {
    titleKey: 'calculators.label_tool_markup_title',
    bodyKey: 'calculators.label_tool_markup_body',
  },
  discount: {
    titleKey: 'calculators.label_tool_discount_title',
    bodyKey: 'calculators.label_tool_discount_body',
  },
  tax: {
    titleKey: 'calculators.label_tool_tax_title',
    bodyKey: 'calculators.label_tool_tax_body',
  },
};

const RULE_KEYS: readonly EnglishStringKey[] = [
  'calculators.label_rule_currency',
  'calculators.label_rule_rounding',
  'calculators.label_rule_decimal',
  'calculators.label_rule_nothing_stored',
];

export default function CalculatorsPage(): React.ReactElement {
  return (
    <div data-public-page="calculators" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('calculators.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">
            {t('calculators.label_intro')}
          </p>
        </div>
      </section>

      <section data-public-section="tools" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('calculators.label_section_tools_title')}
          </h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {CALCULATOR_TOOLS.map((tool) => (
              <article key={tool} data-tool-card={tool} className="grid content-start gap-4">
                <h3 className="text-lg font-semibold tracking-tight">
                  {t(TOOL_COPY[tool].titleKey)}
                </h3>
                <p className="text-sm text-muted-foreground">{t(TOOL_COPY[tool].bodyKey)}</p>
                <FreeCalculator tool={tool} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-public-section="rules" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('calculators.label_rules_title')}
          </h2>
          <ul className="grid max-w-page gap-3">
            {RULE_KEYS.map((ruleKey) => (
              <li key={ruleKey} className="flex gap-3 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                />
                <span>{t(ruleKey)}</span>
              </li>
            ))}
          </ul>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('calculators.label_note_reuse')}
          </p>
        </div>
      </section>

      <section data-public-section="next" className="border-b border-border">
        <div className="mx-auto flex max-w-page flex-wrap items-center gap-3 px-gutter py-section">
          <Button asChild={true}>
            <Link href="/pricing">{t('calculators.action_pricing')}</Link>
          </Button>
          <Button asChild={true} variant="outline">
            <Link href="/features">{t('calculators.action_features')}</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
