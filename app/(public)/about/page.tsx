// path: app/(public)/about/page.tsx
import { FileText, Landmark, Lock, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The about page.
 *
 * Four sections: what the platform is, how it is built, who it is for, and
 * where to read more. What the page does not carry is the usual furniture of an
 * about page - a founding year, a headcount, an address, a mission statement
 * with a number in it - because none of those is a fact this repository can
 * evidence, and a fabricated one would sit on the page with exactly the same
 * authority as a true one.
 *
 * The audience list describes audiences rather than customers. The distinction
 * is the whole page: an audience is a segment a plan and a module list can
 * describe, and a customer is a party who has to have agreed to be named.
 *
 * The engineering section is the part a reader can verify. Every rule it names
 * is one of the checks that run on every commit, and the last line of the page
 * says where the keyboard reference is, which is the least glamorous and most
 * honest proof that a product documents itself rather than describing itself.
 */
export const metadata: Metadata = {
  title: t('about.meta_title'),
  description: t('about.meta_description'),
  openGraph: {
    type: 'website',
    title: t('about.meta_title'),
    description: t('about.meta_description'),
  },
};

interface AboutPoint {
  readonly id: string;
  readonly key: EnglishStringKey;
}

const WHAT_POINTS: readonly AboutPoint[] = [
  { id: 'isolation', key: 'about.what_point_one' },
  { id: 'audit', key: 'about.what_point_two' },
  { id: 'documents', key: 'about.what_point_three' },
  { id: 'money', key: 'about.what_point_four' },
];

interface HowCard {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
}

const HOW_CARDS: readonly HowCard[] = [
  {
    id: 'checks',
    icon: FileText,
    titleKey: 'about.how_checks_title',
    bodyKey: 'about.how_checks_body',
  },
  {
    id: 'honest',
    icon: Users,
    titleKey: 'about.how_honest_title',
    bodyKey: 'about.how_honest_body',
  },
  {
    id: 'hardening',
    icon: Lock,
    titleKey: 'about.how_hardening_title',
    bodyKey: 'about.how_hardening_body',
  },
  {
    id: 'accessibility',
    icon: ShieldCheck,
    titleKey: 'about.how_accessibility_title',
    bodyKey: 'about.how_accessibility_body',
  },
];

const AUDIENCES: readonly AboutPoint[] = [
  { id: 'agencies', key: 'about.audience_one' },
  { id: 'retail', key: 'about.audience_two' },
  { id: 'firms', key: 'about.audience_three' },
  { id: 'groups', key: 'about.audience_four' },
];

export default function AboutPage(): React.ReactElement {
  return (
    <div data-public-page="about" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('about.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('about.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="what" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('about.label_section_what_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('about.label_section_what_body')}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {WHAT_POINTS.map((point) => (
              <li
                key={point.id}
                data-about-point={point.id}
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <Landmark aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{t(point.key)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="how" className="border-b border-border bg-muted/40">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('about.label_section_how_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('about.label_section_how_body')}
            </p>
          </div>
          <ul className="grid gap-6 sm:grid-cols-2">
            {HOW_CARDS.map((card) => (
              <li key={card.id} data-about-card={card.id} className="grid gap-2">
                <card.icon aria-hidden="true" className="size-5 text-primary" />
                <h3 className="text-lg font-semibold">{t(card.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(card.bodyKey)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="audience" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-6 px-gutter py-section">
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">
              {t('about.label_section_audience_title')}
            </h2>
            <p className="max-w-sheet text-base text-muted-foreground">
              {t('about.label_section_audience_body')}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {AUDIENCES.map((audience) => (
              <li
                key={audience.id}
                data-about-audience={audience.id}
                className="rounded-md border border-border bg-card p-4 text-sm"
              >
                {t(audience.key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-public-section="next">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('about.label_section_next_title')}
          </h2>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('about.label_section_next_body')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/features">{t('about.action_features')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">{t('about.action_pricing')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shortcuts">{t('about.action_shortcuts')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
