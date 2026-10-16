// path: app/(public)/invoice-generator/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { publicPageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

/**
 * The free invoice generator page (FEATURE_LIST item 254, with the guest
 * checkout of item 2625 behind it).
 *
 * A shell, and the page says so: what the tool asks for, what it produces, the
 * rules it follows, and a note that names what is not here yet. The page is not
 * a substitute for the tool and does not pretend to be one - it is the
 * specification a reader can hold the tool to when the invoicing module that
 * numbers and totals a document reaches the public site.
 *
 * Why the generator cannot be built out of a form and a few sums: an invoice
 * number belongs to a sequence the workspace owns, tax is computed per line, and
 * a public tool that invented its own numbering and its own rounding would be a
 * second answer to questions the invoicing module answers once. A lead magnet
 * that produces a document the product would not produce is not a demo of the
 * product.
 */
export const metadata: Metadata = publicPageMetadata({
  title: t('generator.meta_title'),
  description: t('generator.meta_description'),
  path: '/invoice-generator',
});

const ASK_KEYS: readonly EnglishStringKey[] = [
  'generator.label_asks_point_one',
  'generator.label_asks_point_two',
  'generator.label_asks_point_three',
  'generator.label_asks_point_four',
];

const GIVE_KEYS: readonly EnglishStringKey[] = [
  'generator.label_gives_point_one',
  'generator.label_gives_point_two',
  'generator.label_gives_point_three',
];

const RULE_KEYS: readonly EnglishStringKey[] = [
  'generator.label_rule_no_account',
  'generator.label_rule_one_currency',
  'generator.label_rule_nothing_stored',
];

export default function InvoiceGeneratorPage(): React.ReactElement {
  return (
    <div data-public-page="generator" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('generator.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('generator.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="asks" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('generator.label_section_asks_title')}
          </h2>
          <PointList pointKeys={ASK_KEYS} columns={2} />
        </div>
      </section>

      <section data-public-section="gives" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('generator.label_section_gives_title')}
          </h2>
          <PointList pointKeys={GIVE_KEYS} />
        </div>
      </section>

      <section data-public-section="rules" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('generator.label_section_rules_title')}
          </h2>
          <PointList pointKeys={RULE_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('generator.label_note_status')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'generator.action_calculators', href: '/calculators' },
          { labelKey: 'generator.action_features', href: '/features', variant: 'outline' },
        ]}
      />
    </div>
  );
}
