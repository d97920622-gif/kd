// path: app/opengraph-image.tsx
import { t } from '@/lib/i18n';
import { buildDefaultOgImage, OG_IMAGE_CONTENT_TYPE, OG_IMAGE_SIZE } from '@/lib/seo/og-image';

/**
 * The default social image, mounted.
 *
 * `lib/seo/og-image.ts` builds the drawing and explains why it is composed
 * rather than uploaded; this file is the route that serves it, which is a file
 * convention: Next.js publishes `/opengraph-image` for it and adds the
 * matching tags to every page's head, so a link to any page of this product
 * previews as the brand rather than as a cropped screenshot.
 *
 * It lives at the application root, which is what makes it the default for the
 * whole site: a route that wants a different image declares one beside its own
 * page, and this file stays the fallback.
 *
 * The alt text is the brand's own description of the image, so the sentence a
 * network shows and the sentence a screen reader announces cannot drift apart -
 * both read the same catalogue key.
 */
export const alt = t('brand.social_image_alt');
export const size = { ...OG_IMAGE_SIZE };
export const contentType = OG_IMAGE_CONTENT_TYPE;

/**
 * Static on purpose, against the root layout's per-request default: the social
 * image is an image rather than a document that runs scripts, so it is
 * generated once per build and served as a file.
 */
export const dynamic = 'force-static';

export default function Image(): ReturnType<typeof buildDefaultOgImage> {
  return buildDefaultOgImage();
}
