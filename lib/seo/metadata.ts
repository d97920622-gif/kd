// path: lib/seo/metadata.ts
import { type Metadata } from 'next';

import { t } from '@/lib/i18n';
import { absoluteUrl, canonicalPath } from '@/lib/seo/site';
import { SOCIAL_IMAGE_ENTRIES } from '@/lib/seo/social-image';

/**
 * The metadata every public page shares, with the three facts a page owns.
 *
 * A public page in this product owns exactly three things: its title, its
 * description and its path. Everything else a link preview or a crawler needs -
 * the canonical address, the site name, the open graph type, the social image,
 * the Twitter card - is the same on all thirteen pages, and it is the same
 * because it is written here rather than thirteen times.
 *
 * That is not a style preference. A page that declares its own `openGraph` block
 * does not merge with the layout's: it replaces it, so the page silently loses
 * every tag the layout would have contributed. The first production run of this
 * sub-step measured exactly that - every public page served an `og:title` and an
 * `og:description` and no `og:image` at all, because the root layout's block had
 * been replaced rather than extended. Composing the block from one function is
 * what makes that class of mistake hard to repeat: a page cannot forget a field
 * it never writes.
 *
 * The page passes its path, and both addresses are built from it. The canonical
 * link and the open graph address stay relative, because `metadataBase` in the
 * root layout is the one place that knows the deployment's own origin and Next
 * resolves them against it; the Twitter card carries the absolute address,
 * because that image is fetched by a reader that never saw this origin.
 */
export interface PublicPageMetadataInput {
  /** The catalogue string, read with `t()` by the page that owns the namespace. */
  readonly title: string;
  readonly description: string;
  /** The site-absolute path, for example `/pricing`. */
  readonly path: string;
}

export function publicPageMetadata(input: PublicPageMetadataInput): Metadata {
  const path = canonicalPath(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: t('brand.name'),
      title: input.title,
      description: input.description,
      url: path,
      images: [...SOCIAL_IMAGE_ENTRIES],
    },
    twitter: {
      card: 'summary_large_image',
      title: input.title,
      description: input.description,
      images: SOCIAL_IMAGE_ENTRIES.map((entry) => absoluteUrl(entry.url)),
    },
  };
}
