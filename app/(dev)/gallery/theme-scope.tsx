// path: app/(dev)/gallery/theme-scope.tsx
import { t } from '@/lib/i18n';

import { type GalleryScope } from './scopes';

/**
 * One theme, pinned to one block of the page.
 *
 * A scope class sets the same custom properties the running application uses,
 * so the components inside it read the colours, the shadows and the motion
 * durations of that theme even though the rest of the page is on a different
 * one. Nothing inside a scope is styled differently for the gallery: if a
 * component has a colour or a duration that does not come from a token, it
 * looks wrong here, which is exactly what the scope is for.
 *
 * The block carries the scope name as a heading and as a data attribute, so a
 * person can see which theme they are looking at and a build check can find
 * every scope in the rendered page.
 */
export interface ThemeScopeProps {
  readonly scope: GalleryScope;
  readonly children: React.ReactNode;
}

export function ThemeScope({ scope, children }: ThemeScopeProps): React.ReactElement {
  return (
    <section
      data-gallery-scope={scope.className}
      aria-labelledby={`${scope.id}-heading`}
      className={`${scope.className} rounded-lg border bg-background p-4 text-foreground`}
    >
      <h2
        id={`${scope.id}-heading`}
        className="mb-4 border-b pb-2 text-2xl font-semibold text-foreground"
      >
        {t('gallery.label_theme_scope')}
        {': '}
        {t(scope.labelKey)}
      </h2>
      <div className="grid gap-6">{children}</div>
    </section>
  );
}
