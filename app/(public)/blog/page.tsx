// path: app/(public)/blog/page.tsx
import { PageActions, PointList } from '@/components/public/point-list';
import { t, type EnglishStringKey } from '@/lib/i18n';
import { publicPageMetadata } from '@/lib/seo/metadata';

import type { Metadata } from 'next';

/**
 * The blog shell (FEATURE_LIST item 248: the public blog list, which arrives
 * with the content module).
 *
 * The route exists, the copy is real and there are no posts, which the page says
 * in one sentence rather than filling a list with invented headlines. A blog
 * list is the easiest place in a product to fabricate content, because an empty
 * page looks broken and a page of plausible titles looks finished; the sentence
 * below is the honest version of that choice, and the properties it promises
 * about a post - an author, a date, an address that does not change - are the
 * properties the content module has to provide before the first note is
 * published.
 *
 * The empty state is not the page-state family's, and that is deliberate: those
 * states belong to a workspace with records and a filter the reader can clear.
 * This one has nothing to clear and nobody to ask, so it is a paragraph in the
 * page, marked for the rendered probe.
 */
export const metadata: Metadata = publicPageMetadata({
  title: t('blog.meta_title'),
  description: t('blog.meta_description'),
  path: '/blog',
});

const SHAPE_KEYS: readonly EnglishStringKey[] = [
  'blog.label_shape_point_one',
  'blog.label_shape_point_two',
  'blog.label_shape_point_three',
];

export default function BlogPage(): React.ReactElement {
  return (
    <div data-public-page="blog" className="grid">
      <section data-public-section="intro" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-3 px-gutter py-section">
          <h1 className="max-w-sheet text-4xl font-semibold tracking-tight">
            {t('blog.label_title')}
          </h1>
          <p className="max-w-sheet text-lg text-muted-foreground">{t('blog.label_intro')}</p>
        </div>
      </section>

      <section data-public-section="posts" className="border-b border-border">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('blog.label_section_posts_title')}
          </h2>
          <p
            data-blog-empty="true"
            className="max-w-sheet rounded-md border border-dashed border-border bg-card p-6 text-base text-muted-foreground"
          >
            {t('blog.label_empty_posts')}
          </p>
        </div>
      </section>

      <section data-public-section="shape" className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-page gap-4 px-gutter py-section">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('blog.label_section_shape_title')}
          </h2>
          <PointList pointKeys={SHAPE_KEYS} />
          <p className="max-w-sheet text-sm text-muted-foreground">{t('blog.label_note_list')}</p>
        </div>
      </section>

      <PageActions
        actions={[
          { labelKey: 'blog.action_features', href: '/features' },
          { labelKey: 'blog.action_pricing', href: '/pricing', variant: 'outline' },
        ]}
      />
    </div>
  );
}
