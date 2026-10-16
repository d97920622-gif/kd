// path: app/(dev)/gallery/showcase-brand.tsx
import Image from 'next/image';

import { LogoMark } from '@/components/branding/logo-mark';
import { t } from '@/lib/i18n';

/**
 * The brand pack from sub-step 1.18, rendered in every theme scope.
 *
 * Two things are being checked here, and neither is decoration:
 *
 *   - The mark follows the current text colour. The glyph above is a stroked
 *     path with no colour of its own, so if it appears in one scope it must
 *     appear in all five, and if it is invisible in exactly one scope then a
 *     colour escaped the token set.
 *   - The size ladder holds. A monogram that reads at 48 pixels and turns into
 *     a smear at 16 was designed at the wrong size, so the same drawing is
 *     shown at every size the product asks for, next to the file that ships.
 *
 * The generated files are shown as themselves: the tab icon, the platform
 * icons and the three logo variants are the artefacts a browser, an operating
 * system and a link preview will fetch, so the page fetches the same URLs
 * rather than a rendering of them. They are fetched without the image
 * optimiser on purpose: the optimiser exists to serve resized product imagery,
 * and a page that exists to audit the brand pack should show the exact bytes a
 * browser is served, not a re-encode of them.
 */
export function ShowcaseBrand(): React.ReactElement {
  const sizes = [16, 24, 32, 48] as const;

  return (
    <section aria-labelledby="gallery-brand-heading" className="grid gap-4">
      <h3 id="gallery-brand-heading" className="text-xl font-semibold">
        {t('gallery.label_section_brand')}
      </h3>

      <div className="flex flex-wrap items-end gap-6">
        {sizes.map((size) => (
          <div key={size} className="grid justify-items-center gap-2">
            <span className="text-base font-medium">
              <LogoMark size={size} variant="glyph" />
            </span>
            <span className="text-sm text-muted-foreground">{`${String(size)} px`}</span>
          </div>
        ))}
        <div className="grid justify-items-center gap-2">
          <LogoMark size={48} variant="plate" />
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_plate')}</span>
        </div>
        <div className="grid justify-items-center gap-2">
          <span className="text-destructive">
            <LogoMark size={32} variant="glyph" title={t('brand.logo_alt')} />
          </span>
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_named')}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="grid justify-items-center gap-2">
          <Image
            src="/favicon.ico"
            width={32}
            height={32}
            unoptimized
            alt={t('gallery.label_brand_favicon')}
          />
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_favicon')}</span>
        </div>
        <div className="grid justify-items-center gap-2">
          <Image
            src="/icons/icon-192.png"
            width={48}
            height={48}
            unoptimized
            alt={t('gallery.label_brand_pwa')}
          />
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_pwa')}</span>
        </div>
        <div className="grid justify-items-center gap-2">
          <Image
            src="/icons/icon-maskable-512.png"
            width={48}
            height={48}
            unoptimized
            alt={t('gallery.label_brand_maskable')}
          />
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_maskable')}</span>
        </div>
        <div className="grid justify-items-center gap-2">
          <Image
            src="/brand/logo-light.svg"
            width={48}
            height={48}
            unoptimized
            alt={t('gallery.label_brand_wordmark')}
          />
          <span className="text-sm text-muted-foreground">{t('gallery.label_brand_wordmark')}</span>
        </div>
      </div>
    </section>
  );
}
