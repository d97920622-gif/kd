// path: app/(public)/industries/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The industries page (FEATURE_LIST item 218).
 *
 * Six cards, each written as situation, work and rule. The page exists because
 * the question an industry landing page answers is not "who else uses this" -
 * this build has no customer it may name - but "does this product understand
 * how my money arrives". A card that describes the shape of the billing answers
 * that question honestly, and it is the shape a later step fills in with a real
 * customer's story once the owner supplies one.
 *
 * The page is a server component with no client boundary: every card is text
 * and every action is a link.
 */
export const metadata: Metadata = {
  title: t('industries.meta_title'),
  description: t('industries.meta_description'),
  openGraph: {
    type: 'website',
    title: t('industries.meta_title'),
    description: t('industries.meta_description'),
  },
};

interface Industry {
  readonly id: string;
  readonly titleKey: EnglishStringKey;
  readonly situationKey: EnglishStringKey;
  readonly workKey: EnglishStringKey;
  readonly ruleKey: EnglishStringKey;
}

const INDUSTRIES: readonly Industry[] = [
  {
    id: 'freelance',
    titleKey: 'industries.label_freelance_title',
    situationKey: 'industries.label_freelance_situation',
    workKey: 'industries.label_freelance_work',
    ruleKey: 'industries.label_freelance_rule',
  },
  {
    id: 'agency',
    titleKey: 'industries.label_agency_title',
    situationKey: 'industries.label_agency_situation',
    workKey: 'industries.label_agency_work',
    ruleKey: 'industries.label_agency_rule',
  },
  {
    id: 'retail',
    titleKey: 'industries.label_retail_title',
    situationKey: 'industries.label_retail_situation',
    workKey: 'industries.label_retail_work',
    ruleKey: 'industries.label_retail_rule',
  },
  {
    id: 'trades',
    titleKey: 'industries.label_trades_title',
    situationKey: 'industries.label_trades_situation',
    workKey: 'industries.label_trades_work',
    ruleKey: 'industries.label_trades_rule',
  },
  {
    id: 'services',
    titleKey: 'industries.label_services_title',
    situationKey: 'industries.label_services_situation',
    workKey: 'industries.label_services_work',
    ruleKey: 'industries.label_services_rule',
  },
  {
    id: 'online',
    titleKey: 'industries.label_online_title',
    situationKey: 'industries.label_online_situation',
    workKey: 'industries.label_online_work',
    ruleKey: 'industries.label_online_rule',
  },
];

const COMMON_KEYS: readonly EnglishStringKey[] = [
  'industries.label_common_point_one',
  'industries.label_common_point_two',
  'industries.label_common_point_three',
];

export default function IndustriesPage(): React.ReactElement {
  return (
    <div data-public-page="industries" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('industries.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('industries.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="fit" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('industries.label_section_fit_title')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRIES.map((industry) => (
              <article
                key={industry.id}
                data-industry={industry.id}
                className="grid content-start gap-3 rounded-md border border-border bg-card p-6"
              >
                <h3 className="text-lg font-semibold tracking-tight">{t(industry.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(industry.situationKey)}</p>
                <p className="text-sm">{t(industry.workKey)}</p>
                <p className="text-sm text-muted-foreground">{t(industry.ruleKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section data-public-section="common" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('industries.label_section_common_title')}
          </h2>
          <PointList pointKeys={COMMON_KEYS} columns={3} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('industries.label_note_build')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'industries.action_pricing', href: '/pricing' },
          { labelKey: 'industries.action_contact', href: '/contact', variant: 'outline' },
        ]}
      />
    </div>
  );
}
