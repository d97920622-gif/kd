// path: app/(public)/features/page.tsx
import { CircleCheck, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { publicPageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

/**
 * The features page.
 *
 * Eight modules, each rendered from a list of keys: a title, a paragraph and
 * three or four capabilities. The page is long on purpose - a reader who is
 * deciding whether to trust a business platform wants the list, not a carousel
 * of three adjectives - and it stays readable because every module is the same
 * shape.
 *
 * The page is a server component with no state, no fetching and no client
 * boundary at all. The only interactive elements are the two links at the
 * bottom, which are anchors.
 *
 * The note under the introduction (`features.label_note_build`) is the honest
 * half of the page: the modules arrive over the steps of the plan, and a reader
 * is told they are reading a description of the platform rather than a release
 * announcement.
 */
export const metadata: Metadata = publicPageMetadata({
  title: t('features.meta_title'),
  description: t('features.meta_description'),
  path: '/features',
});

interface FeatureGroup {
  readonly id: string;
  readonly icon: LucideIcon;
  readonly titleKey: EnglishStringKey;
  readonly bodyKey: EnglishStringKey;
  readonly pointKeys: readonly EnglishStringKey[];
}

const GROUPS: readonly FeatureGroup[] = [
  {
    id: 'invoicing',
    icon: CircleCheck,
    titleKey: 'features.group_invoicing_title',
    bodyKey: 'features.group_invoicing_body',
    pointKeys: [
      'features.group_invoicing_point_one',
      'features.group_invoicing_point_two',
      'features.group_invoicing_point_three',
      'features.group_invoicing_point_four',
    ],
  },
  {
    id: 'clients',
    icon: CircleCheck,
    titleKey: 'features.group_clients_title',
    bodyKey: 'features.group_clients_body',
    pointKeys: [
      'features.group_clients_point_one',
      'features.group_clients_point_two',
      'features.group_clients_point_three',
    ],
  },
  {
    id: 'payments',
    icon: CircleCheck,
    titleKey: 'features.group_payments_title',
    bodyKey: 'features.group_payments_body',
    pointKeys: [
      'features.group_payments_point_one',
      'features.group_payments_point_two',
      'features.group_payments_point_three',
    ],
  },
  {
    id: 'tax',
    icon: CircleCheck,
    titleKey: 'features.group_tax_title',
    bodyKey: 'features.group_tax_body',
    pointKeys: [
      'features.group_tax_point_one',
      'features.group_tax_point_two',
      'features.group_tax_point_three',
    ],
  },
  {
    id: 'messaging',
    icon: CircleCheck,
    titleKey: 'features.group_messaging_title',
    bodyKey: 'features.group_messaging_body',
    pointKeys: [
      'features.group_messaging_point_one',
      'features.group_messaging_point_two',
      'features.group_messaging_point_three',
    ],
  },
  {
    id: 'team',
    icon: CircleCheck,
    titleKey: 'features.group_team_title',
    bodyKey: 'features.group_team_body',
    pointKeys: [
      'features.group_team_point_one',
      'features.group_team_point_two',
      'features.group_team_point_three',
    ],
  },
  {
    id: 'reporting',
    icon: CircleCheck,
    titleKey: 'features.group_reporting_title',
    bodyKey: 'features.group_reporting_body',
    pointKeys: [
      'features.group_reporting_point_one',
      'features.group_reporting_point_two',
      'features.group_reporting_point_three',
    ],
  },
  {
    id: 'security',
    icon: CircleCheck,
    titleKey: 'features.group_security_title',
    bodyKey: 'features.group_security_body',
    pointKeys: [
      'features.group_security_point_one',
      'features.group_security_point_two',
      'features.group_security_point_three',
    ],
  },
];

export default function FeaturesPage(): React.ReactElement {
  return (
    <div data-public-page="features" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('features.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('features.label_intro')}</p>
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('features.label_note_build')}
          </p>
        </div>
      </section>

      <section data-public-section="modules">
        <div className="mx-auto grid max-w-page gap-12 px-gutter py-section">
          {GROUPS.map((group) => (
            <article
              key={group.id}
              data-feature-group={group.id}
              className="grid gap-4 border-t border-border pt-8"
            >
              <div className="grid gap-2">
                <group.icon aria-hidden="true" className="size-5 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight">{t(group.titleKey)}</h2>
                <p className="max-w-sheet text-base text-muted-foreground">{t(group.bodyKey)}</p>
              </div>
              <ul className="grid gap-2">
                {group.pointKeys.map((pointKey) => (
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

      <section data-public-section="cta" className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('features.label_section_next_title')}
          </h2>
          <p className="max-w-sheet text-base text-muted-foreground">
            {t('features.label_section_next_body')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/pricing">{t('features.action_pricing')}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/shortcuts">{t('features.action_shortcuts')}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
