// path: app/(public)/contact/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { publicPageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

/**
 * The contact page (FEATURE_LIST item 225).
 *
 * Three sections and a note. The page states what a useful message contains,
 * what the support module does with one, and what must never be sent through it,
 * and then it says plainly that the address, the number and the queue belong to
 * the deployment rather than to this repository (item 225's ticket fallback:
 * a message becomes a ticket against the workspace it came from).
 *
 * That last paragraph is why the page can exist in step 1 without inventing
 * anything. A contact page whose address is fiction is worse than no contact
 * page: a reader sends a message into a mailbox that nobody owns. The honest
 * version names the configuration point and hands the reader the surfaces that
 * already answer most of what they came to ask.
 */
export const metadata: Metadata = publicPageMetadata({
  title: t('contact.meta_title'),
  description: t('contact.meta_description'),
  path: '/contact',
});

const INCLUDE_KEYS: readonly EnglishStringKey[] = [
  'contact.label_include_point_one',
  'contact.label_include_point_two',
  'contact.label_include_point_three',
];

const NEXT_KEYS: readonly EnglishStringKey[] = [
  'contact.label_next_point_one',
  'contact.label_next_point_two',
  'contact.label_next_point_three',
];

const NEVER_KEYS: readonly EnglishStringKey[] = [
  'contact.label_never_point_one',
  'contact.label_never_point_two',
];

export default function ContactPage(): React.ReactElement {
  return (
    <div data-public-page="contact" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('contact.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('contact.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="include" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('contact.label_section_include_title')}
          </h2>
          <PointList pointKeys={INCLUDE_KEYS} />
        </div>
      </section>

      <section data-public-section="next" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('contact.label_section_next_title')}
          </h2>
          <PointList pointKeys={NEXT_KEYS} />
        </div>
      </section>

      <section data-public-section="never" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('contact.label_section_never_title')}
          </h2>
          <PointList pointKeys={NEVER_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('contact.label_note_address')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'contact.action_features', href: '/features' },
          { labelKey: 'contact.action_pricing', href: '/pricing', variant: 'outline' },
          { labelKey: 'contact.action_shortcuts', href: '/shortcuts', variant: 'ghost' },
        ]}
      />
    </div>
  );
}
