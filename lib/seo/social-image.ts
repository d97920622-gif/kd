// path: lib/seo/social-image.ts
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/config/brand';
import { t } from '@/lib/i18n';

/**
 * The social image, described once for every page.
 *
 * The file convention publishes `/opengraph-image` and the root layout receives
 * the tag for free, but a page that declares its own `openGraph` block replaces
 * the parent's block rather than adding to it - so from the moment a page wants
 * its own title and description, it also has to name the image, and the first
 * production run of this sub-step served a landing page with an `og:title` and
 * no `og:image` to prove it.
 *
 * The path, the dimensions and the alt text are therefore defined here and
 * composed by `publicPageMetadata()`, so thirteen pages cannot disagree about
 * any of the three, and no page has a reason to write an image tag of its own.
 *
 * The alt text is the brand's own catalogue string, which is the same string
 * `app/opengraph-image.tsx` exports: the sentence a network shows beside a link
 * and the sentence a screen reader announces are one sentence, not two.
 */
export const SOCIAL_IMAGE_PATH = '/opengraph-image';

/** The entry the open graph block carries, in the shape that block expects. */
export const SOCIAL_IMAGE_ENTRIES = [
  {
    url: SOCIAL_IMAGE_PATH,
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    alt: t('brand.social_image_alt'),
  },
] as const;
