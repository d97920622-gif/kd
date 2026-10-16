// path: app/(public)/offline/page.tsx
import { OfflineBanner } from '@/components/layout/offline-banner';
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { publicPageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

/**
 * The offline page (FEATURE_LIST item 3581: the PWA fallback; FEATURE_LIST item
 * 109 is the banner sub-step 1.24 built, which this page renders).
 *
 * The temptation on a page like this is to promise a product that works offline,
 * and this build does not have one: caching pages and replaying requests is the
 * service worker (item 3378), and the file ownership matrix puts it in a later
 * step. So the page states what is true today - a page already open still reads,
 * an edit in a form is kept in this browser, a failed operation is the reader's
 * to retry - and then says in one sentence that this page is text rather than a
 * cached copy of the product.
 *
 * The banner is mounted here as well as in the shells, because this is the one
 * page a reader reaches while the connection is already gone: the banner is the
 * element that knows the answer, and a page about the connection should show its
 * state rather than describe it.
 */
export const metadata: Metadata = publicPageMetadata({
  title: t('offline.meta_title'),
  description: t('offline.meta_description'),
  path: '/offline',
});

const WORK_KEYS: readonly EnglishStringKey[] = [
  'offline.label_works_point_one',
  'offline.label_works_point_two',
  'offline.label_works_point_three',
];

const NEXT_KEYS: readonly EnglishStringKey[] = [
  'offline.label_next_point_one',
  'offline.label_next_point_two',
];

export default function OfflinePage(): React.ReactElement {
  return (
    <div data-public-page="offline" className="grid">
      <OfflineBanner />
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('offline.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('offline.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="works" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('offline.label_section_works_title')}
          </h2>
          <PointList pointKeys={WORK_KEYS} />
        </div>
      </section>

      <section data-public-section="returns" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('offline.label_section_next_title')}
          </h2>
          <PointList pointKeys={NEXT_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">
            {t('offline.label_note_scope')}
          </p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'offline.action_home', href: '/' },
          { labelKey: 'offline.action_features', href: '/features', variant: 'outline' },
        ]}
      />
    </div>
  );
}
