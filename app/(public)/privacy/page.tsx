// path: app/(public)/privacy/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The privacy policy page (FEATURE_LIST item 230).
 *
 * A privacy policy is a description of what a product actually does with data,
 * and this page is the one place where the difference between an outline and a
 * promise matters most. So it is written in two halves a reader can check
 * against the build: what the platform collects and keeps, and what it
 * deliberately does not - no advertising identifiers, no tracking pixel in a
 * document it sends, and no payment numbers, because those belong to the payment
 * partners.
 *
 * The closing paragraph names the boundary the same way the terms page does: the
 * sentences above describe the build, and the binding policy is supplied by the
 * business that runs this deployment, with the remaining documents of the group -
 * refunds, cookies, data processing, service levels - following the same rule.
 */
export const metadata: Metadata = {
  title: t('legal.privacy_meta_title'),
  description: t('legal.privacy_meta_description'),
  openGraph: {
    type: 'website',
    title: t('legal.privacy_meta_title'),
    description: t('legal.privacy_meta_description'),
  },
};

const COLLECT_KEYS: readonly EnglishStringKey[] = [
  'legal.privacy_collect_point_one',
  'legal.privacy_collect_point_two',
  'legal.privacy_collect_point_three',
];

const NOT_COLLECT_KEYS: readonly EnglishStringKey[] = [
  'legal.privacy_not_collect_point_one',
  'legal.privacy_not_collect_point_two',
  'legal.privacy_not_collect_point_three',
];

const ASK_KEYS: readonly EnglishStringKey[] = [
  'legal.privacy_ask_point_one',
  'legal.privacy_ask_point_two',
];

export default function PrivacyPage(): React.ReactElement {
  return (
    <div data-public-page="privacy" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('legal.privacy_label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">
            {t('legal.privacy_label_intro')}
          </p>
        </div>
      </section>

      <section data-public-section="collect" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('legal.privacy_label_section_collect_title')}
          </h2>
          <PointList pointKeys={COLLECT_KEYS} />
        </div>
      </section>

      <section data-public-section="not-collect" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('legal.privacy_label_section_not_collect_title')}
          </h2>
          <PointList pointKeys={NOT_COLLECT_KEYS} />
        </div>
      </section>

      <section data-public-section="ask" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('legal.privacy_label_section_ask_title')}
          </h2>
          <PointList pointKeys={ASK_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('legal.privacy_label_note_scope')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'legal.action_terms', href: '/terms' },
          { labelKey: 'legal.action_contact', href: '/contact', variant: 'outline' },
        ]}
      />
    </div>
  );
}
