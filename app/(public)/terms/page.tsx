// path: app/(public)/terms/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';

import type { Metadata } from 'next';

/**
 * The terms of service page (FEATURE_LIST item 229).
 *
 * The page prints an outline, not an agreement, and that is the decision this
 * file records. A licence is a statement a business makes about itself - who it
 * is, what it undertakes, where it is answerable - and a build cannot invent one
 * any more than it can invent a founding year. Writing plausible terms here
 * would be the most expensive paragraph in the repository, because a reader
 * could rely on it.
 *
 * What the page gives instead is the shape of the document: what it covers, and
 * the fact that a published version is kept with the date it took effect, so a
 * reader can see which version applied to a given period. The binding text is
 * supplied by the deployment, which is the same rule the contact page follows
 * for its address.
 */
export const metadata: Metadata = {
  title: t('legal.terms_meta_title'),
  description: t('legal.terms_meta_description'),
  openGraph: {
    type: 'website',
    title: t('legal.terms_meta_title'),
    description: t('legal.terms_meta_description'),
  },
};

const COVER_KEYS: readonly EnglishStringKey[] = [
  'legal.terms_cover_point_one',
  'legal.terms_cover_point_two',
  'legal.terms_cover_point_three',
  'legal.terms_cover_point_four',
];

export default function TermsPage(): React.ReactElement {
  return (
    <div data-public-page="terms" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('legal.terms_label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">
            {t('legal.terms_label_intro')}
          </p>
        </div>
      </section>

      <section data-public-section="covers" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('legal.terms_label_section_covers_title')}
          </h2>
          <PointList pointKeys={COVER_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('legal.terms_label_note_publish')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'legal.action_privacy', href: '/privacy' },
          { labelKey: 'legal.action_contact', href: '/contact', variant: 'outline' },
        ]}
      />
    </div>
  );
}
