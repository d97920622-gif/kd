// path: components/layout/print-marker.tsx
import { t } from '@/lib/i18n';
import { brand } from '@/lib/i18n/strings/en/brand';
import { siteUrl } from '@/lib/seo/site';

/**
 * The line every printed page carries, and the reason it exists.
 *
 * A screen is not a sheet of paper, and the difference that matters here is
 * that paper has no address bar. A reader who prints a pricing page, an
 * invoice or a receipt keeps one artefact and loses the two pieces of context
 * the screen was carrying for them: which site it came from and what it is.
 * The browser prints its own header only when the reader turns that on, and
 * the product cannot rely on a setting.
 *
 * So the product prints its own. The marker is hidden on screen and revealed
 * by the print base, which is the same contract every other paper-only block
 * uses (`data-print="only"`), and it renders exactly once per document because
 * it belongs to the document rather than to a shell: the root layout mounts it
 * after the page content, so a surface that never thought about printing - a
 * future invoice view, a receipt, an error page - still carries it.
 *
 * Two facts, no decoration: the product name and the address it was served
 * from. The name is the brand string the rest of the product uses, so a rename
 * reaches paper with everything else, and the address comes from the same
 * environment value the sitemap and the canonical links are built from.
 */
export function PrintMarker(): React.ReactElement {
  return (
    <div data-layout="print-marker" data-print="only" className="px-gutter py-4">
      <p className="text-sm text-muted-foreground">
        {t('shells.label_print_marker', { brand: brand.name, site: siteUrl() })}
      </p>
    </div>
  );
}
