// path: app/(public)/pricing/page.tsx
import { CircleCheck } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The pricing page.
 *
 * Four plans in one grid, then what every plan includes, then the three things
 * a reader needs to know before choosing. Prices and limits come from
 * `lib/i18n/strings/en/pricing.ts`, which is the single owner of both - the
 * homepage preview reads the same keys, so the two pages cannot disagree.
 *
 * **The prices are rendered, never computed.** No arithmetic touches them on
 * this page: an annual price is a written figure rather than a multiplication,
 * because the money rule (`docs/PLAN/02`) keeps arithmetic in `decimal.js` and
 * out of a marketing page. The sentence that explains the annual figure - ten
 * monthly payments rather than twelve - is copy, and a reader can check it
 * against the two numbers beside it.
 *
 * **Enterprise states no price.** The card says the price is agreed per
 * engagement and lists what that conversation covers, which is honest where a
 * fabricated number would not be.
 *
 * There is no comparison table with a competitor, because
 * `scripts/checks/public-site.mjs` fails on the vocabulary of an
 * unsubstantiated comparison, and `FEATURE_LIST` item 220 describes that page
 * as a separate deliverable with its own evidence.
 */
export const metadata: Metadata = {
  title: t('pricing.meta_title'),
  description: t('pricing.meta_description'),
  openGraph: {
    type: 'website',
    title: t('pricing.meta_title'),
    description: t('pricing.meta_description'),
  },
};

interface TierBase {
  readonly id: string;
  readonly nameKey: EnglishStringKey;
  readonly summaryKey: EnglishStringKey;
  readonly pointKeys: readonly EnglishStringKey[];
  readonly featured: boolean;
}

/** A tier with a published price: monthly and annual figures, both written. */
interface PublishedTier extends TierBase {
  readonly published: true;
  readonly monthlyKey: EnglishStringKey;
  readonly yearlyKey: EnglishStringKey;
}

/**
 * A tier whose price is agreed rather than published. The type carries no price
 * key on purpose: there is no figure to render, and a key pointing at an empty
 * string would be a price that looks published and reads as nothing.
 */
interface AgreedTier extends TierBase {
  readonly published: false;
}

type PricingTier = PublishedTier | AgreedTier;

const TIERS: readonly PricingTier[] = [
  {
    id: 'free',
    nameKey: 'pricing.tier_free_name',
    monthlyKey: 'pricing.tier_free_price_monthly',
    yearlyKey: 'pricing.tier_free_price_yearly',
    summaryKey: 'pricing.tier_free_summary',
    pointKeys: [
      'pricing.tier_free_point_one',
      'pricing.tier_free_point_two',
      'pricing.tier_free_point_three',
      'pricing.tier_free_point_four',
    ],
    published: true,
    featured: false,
  },
  {
    id: 'starter',
    nameKey: 'pricing.tier_starter_name',
    monthlyKey: 'pricing.tier_starter_price_monthly',
    yearlyKey: 'pricing.tier_starter_price_yearly',
    summaryKey: 'pricing.tier_starter_summary',
    pointKeys: [
      'pricing.tier_starter_point_one',
      'pricing.tier_starter_point_two',
      'pricing.tier_starter_point_three',
      'pricing.tier_starter_point_four',
    ],
    published: true,
    featured: false,
  },
  {
    id: 'pro',
    nameKey: 'pricing.tier_pro_name',
    monthlyKey: 'pricing.tier_pro_price_monthly',
    yearlyKey: 'pricing.tier_pro_price_yearly',
    summaryKey: 'pricing.tier_pro_summary',
    pointKeys: [
      'pricing.tier_pro_point_one',
      'pricing.tier_pro_point_two',
      'pricing.tier_pro_point_three',
      'pricing.tier_pro_point_four',
    ],
    published: true,
    featured: true,
  },
  {
    id: 'enterprise',
    nameKey: 'pricing.tier_enterprise_name',
    summaryKey: 'pricing.tier_enterprise_summary',
    pointKeys: [
      'pricing.tier_enterprise_point_one',
      'pricing.tier_enterprise_point_two',
      'pricing.tier_enterprise_point_three',
      'pricing.tier_enterprise_point_four',
    ],
    published: false,
    featured: false,
  },
];

interface IncludedPoint {
  readonly id: string;
  readonly key: EnglishStringKey;
}

const INCLUDED: readonly IncludedPoint[] = [
  { id: 'documents', key: 'pricing.included_one' },
  { id: 'tax', key: 'pricing.included_two' },
  { id: 'audit', key: 'pricing.included_three' },
  { id: 'signin', key: 'pricing.included_four' },
  { id: 'export', key: 'pricing.included_five' },
];

interface PricingNote {
  readonly id: string;
  readonly key: EnglishStringKey;
}

const NOTES: readonly PricingNote[] = [
  { id: 'usd', key: 'pricing.note_usd' },
  { id: 'annual', key: 'pricing.note_annual' },
  { id: 'change', key: 'pricing.note_change' },
  { id: 'data', key: 'pricing.note_data' },
];

export default function PricingPage(): React.ReactElement {
  return (
    <div data-public-page="pricing" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('pricing.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('pricing.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="plans" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              data-plan={tier.id}
              data-plan-featured={tier.featured ? 'true' : 'false'}
              className="grid content-start gap-4 rounded-md border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{t(tier.nameKey)}</h2>
                {tier.featured ? (
                  <Badge variant="secondary">{t('pricing.label_popular')}</Badge>
                ) : null}
              </div>
              <div className="grid gap-1">
                {tier.published ? (
                  <p data-plan-figure={tier.id} className="text-3xl font-semibold tracking-tight">
                    ${t(tier.monthlyKey)}
                  </p>
                ) : (
                  <p data-plan-figure={tier.id} className="text-3xl font-semibold tracking-tight">
                    {t('pricing.label_enterprise_price')}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{t('pricing.label_period_monthly')}</p>
                {tier.published ? (
                  <p data-plan-annual-figure={tier.id} className="text-sm text-muted-foreground">
                    ${t(tier.yearlyKey)} {t('pricing.label_period_yearly')}
                  </p>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">{t(tier.summaryKey)}</p>
              <ul className="grid gap-2">
                {tier.pointKeys.map((pointKey) => (
                  <li key={pointKey} className="flex gap-2 text-sm">
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-primary"
                    />
                    <span>{t(pointKey)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section data-public-section="included" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('pricing.label_included_title')}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {INCLUDED.map((point) => (
              <li key={point.id} className="flex gap-2 text-sm">
                <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(point.key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="notes" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('pricing.label_notes_title')}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {NOTES.map((note) => (
              <li key={note.id} data-note={note.id} className="text-sm text-muted-foreground">
                {t(note.key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="cta">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">{t('pricing.label_cta_title')}</h2>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('pricing.label_cta_body')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/features">{t('pricing.action_features')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/about">{t('pricing.action_about')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
