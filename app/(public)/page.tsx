// path: app/(public)/page.tsx
import {
  BarChart3,
  FileText,
  Landmark,
  MessagesSquare,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The homepage.
 *
 * Six sections, in the order a reader needs them: what this is, what it does,
 * how it works, why it can be believed, what it costs, and where to read more.
 * The order is the argument, so the sections are written in one file rather
 * than assembled from a config that could be reordered without the argument
 * changing with it.
 *
 * **Every sentence is in the catalogue.** The section lists below hold keys and
 * icons, never words, which is what keeps the page a layout and the copy a
 * data change.
 *
 * **The prices on this page are the pricing page's prices.** The preview cards
 * read `pricing.*`, so a price changes in one file. A homepage with its own
 * copy of a price is a homepage that will one day disagree with the invoice
 * behind it.
 *
 * **There is no social proof section.** No testimonial, no logo wall, no count
 * of users: `FEATURE_LIST` items 210 to 216 describe them and this page does
 * not carry them until there is a customer whose words can be quoted, which
 * `scripts/checks/public-site.mjs` enforces by failing on the vocabulary of a
 * claim this build cannot evidence.
 *
 * The two calls to action go to `/features` and `/pricing`, because those are
 * the pages that exist. Authentication arrives in step 3, and the sign-up
 * button appears on this page in the same commit as the page it points at.
 */
export const metadata: Metadata = {
  title: t('home.meta_title'),
  description: t('home.meta_description'),
  openGraph: {
    type: 'website',
    title: t('home.meta_title'),
    description: t('home.meta_description'),
  },
};

interface Capability {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
}

const CAPABILITIES: readonly Capability[] = [
  {
    id: 'invoicing',
    icon: FileText,
    titleKey: 'home.capability_invoicing_title',
    bodyKey: 'home.capability_invoicing_body',
  },
  {
    id: 'clients',
    icon: Users,
    titleKey: 'home.capability_clients_title',
    bodyKey: 'home.capability_clients_body',
  },
  {
    id: 'payments',
    icon: Landmark,
    titleKey: 'home.capability_payments_title',
    bodyKey: 'home.capability_payments_body',
  },
  {
    id: 'tax',
    icon: BarChart3,
    titleKey: 'home.capability_tax_title',
    bodyKey: 'home.capability_tax_body',
  },
  {
    id: 'messaging',
    icon: MessagesSquare,
    titleKey: 'home.capability_messaging_title',
    bodyKey: 'home.capability_messaging_body',
  },
  {
    id: 'team',
    icon: ShieldCheck,
    titleKey: 'home.capability_team_title',
    bodyKey: 'home.capability_team_body',
  },
];

interface HomeStep {
  readonly id: string;
  readonly numberKey: EnglishStringKey;
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
}

const STEPS: readonly HomeStep[] = [
  {
    id: 'setup',
    numberKey: 'home.step_one_number',
    titleKey: 'home.step_one_title',
    bodyKey: 'home.step_one_body',
  },
  {
    id: 'send',
    numberKey: 'home.step_two_number',
    titleKey: 'home.step_two_title',
    bodyKey: 'home.step_two_body',
  },
  {
    id: 'report',
    numberKey: 'home.step_three_number',
    titleKey: 'home.step_three_title',
    bodyKey: 'home.step_three_body',
  },
];

interface TrustPoint {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
}

const TRUST_POINTS: readonly TrustPoint[] = [
  {
    id: 'audit',
    icon: FileText,
    titleKey: 'home.trust_audit_title',
    bodyKey: 'home.trust_audit_body',
  },
  {
    id: 'isolation',
    icon: ShieldCheck,
    titleKey: 'home.trust_isolation_title',
    bodyKey: 'home.trust_isolation_body',
  },
  {
    id: 'money',
    icon: Landmark,
    titleKey: 'home.trust_money_title',
    bodyKey: 'home.trust_money_body',
  },
  {
    id: 'accessibility',
    icon: Users,
    titleKey: 'home.trust_accessibility_title',
    bodyKey: 'home.trust_accessibility_body',
  },
];

interface PricingPreview {
  readonly id: string;
  readonly nameKey: EnglishStringKey;
  readonly priceKey: EnglishStringKey;
  readonly summaryKey: EnglishStringKey;
}

const PRICING_PREVIEW: readonly PricingPreview[] = [
  {
    id: 'free',
    nameKey: 'pricing.tier_free_name',
    priceKey: 'pricing.tier_free_price_monthly',
    summaryKey: 'pricing.tier_free_summary',
  },
  {
    id: 'starter',
    nameKey: 'pricing.tier_starter_name',
    priceKey: 'pricing.tier_starter_price_monthly',
    summaryKey: 'pricing.tier_starter_summary',
  },
  {
    id: 'pro',
    nameKey: 'pricing.tier_pro_name',
    priceKey: 'pricing.tier_pro_price_monthly',
    summaryKey: 'pricing.tier_pro_summary',
  },
];

export default function HomePage(): React.ReactElement {
  return (
    <div data-public-page="home" className="grid">
      <section data-public-section="hero" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('home.label_hero_eyebrow')}
          </p>
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('home.label_hero_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('home.label_hero_body')}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/features">{t('home.action_hero_features')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">{t('home.action_hero_pricing')}</Link>
            </Button>
          </div>
          <p className="max-w-sheet text-sm text-muted-foreground">{t('home.label_note_build')}</p>
        </div>
      </section>

      <section data-public-section="capabilities" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-8 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('home.label_section_capabilities_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('home.label_section_capabilities_body')}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((capability) => (
              <li
                key={capability.id}
                data-capability={capability.id}
                className="grid gap-3 rounded-md border border-border bg-card p-6"
              >
                <capability.icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">{t(capability.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(capability.bodyKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="how" className="border-b border-border bg-muted/40">
        <div className="mx-auto grid max-w-page gap-8 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('home.label_section_how_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('home.label_section_how_body')}
            </p>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.id} data-step={step.id} className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t(step.numberKey)}
                </span>
                <h3 className="text-lg font-semibold">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(step.bodyKey)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-public-section="trust" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-8 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('home.label_section_trust_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('home.label_section_trust_body')}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {TRUST_POINTS.map((point) => (
              <li key={point.id} data-trust={point.id} className="grid gap-2">
                <point.icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">{t(point.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(point.bodyKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="pricing-preview" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-8 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('home.label_section_pricing_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('home.label_section_pricing_body')}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-3">
            {PRICING_PREVIEW.map((tier) => (
              <li
                key={tier.id}
                data-preview-tier={tier.id}
                className="grid gap-2 rounded-md border border-border p-6"
              >
                <h3 className="text-lg font-semibold">{t(tier.nameKey)}</h3>
                <p className="text-3xl font-semibold tracking-tight">${t(tier.priceKey)}</p>
                <p className="text-sm text-muted-foreground">{t('pricing.label_period_monthly')}</p>
                <p className="text-sm text-muted-foreground">{t(tier.summaryKey)}</p>
              </li>
            ))}
          </ul>
          <div>
            <Button asChild variant="outline">
              <Link href="/pricing">{t('home.action_pricing')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section data-public-section="cta">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('home.label_section_cta_title')}
          </h2>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('home.label_section_cta_body')}
          </p>
          <div>
            <Button asChild size="lg">
              <Link href="/features">{t('home.action_cta_features')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
