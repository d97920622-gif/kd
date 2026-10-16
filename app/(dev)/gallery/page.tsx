// path: app/(dev)/gallery/page.tsx
import { type Metadata } from 'next';

import { t } from '@/lib/i18n';

import { GALLERY_SCOPES } from './scopes';
import { ShowcaseControls } from './showcase-controls';
import { ShowcaseData } from './showcase-data';
import { ShowcaseFeedback } from './showcase-feedback';
import { ShowcaseForms } from './showcase-forms';
import { ShowcasePanels } from './showcase-panels';
import { ThemeScope } from './theme-scope';

/**
 * The component gallery: every shared component, in every theme, in one page.
 *
 * The page renders the same full set of components five times, once inside
 * each scope from `scopes.ts`: light, dark, high contrast light, high contrast
 * dark, and reduced motion. Rendering the same tree in each scope is what
 * turns this page into evidence rather than a screenshot collection:
 *
 *   - a component that reads a colour outside the token set looks wrong in at
 *     least one scope, because the scope only changes custom properties;
 *   - a component that animates keeps animating in the reduced motion scope if
 *     it hard cased a duration, which is visible next to the same component
 *     outside the scope;
 *   - a control that lost its focus ring fails the review in all five, since
 *     the ring is drawn from the same tokens.
 *
 * Two rules this page follows about itself: it renders only primitives and
 * their states, never a product screen, so it cannot drift into being a second
 * implementation of a feature; and every string it shows comes from the
 * catalogue, including the text inside the demo inputs.
 *
 * The route exists in development only; the layout above answers 404
 * everywhere else.
 */
export const metadata: Metadata = {
  title: t('gallery.label_title'),
  description: t('gallery.label_description'),
};

export default function GalleryPage(): React.ReactElement {
  return (
    <main className="mx-auto grid max-w-7xl gap-8 p-4 md:p-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold">{t('gallery.label_title')}</h1>
        <p className="text-base text-muted-foreground">{t('gallery.label_description')}</p>
      </header>

      {GALLERY_SCOPES.map((scope) => (
        <ThemeScope key={scope.id} scope={scope}>
          <ShowcaseControls />
          <ShowcaseForms />
          <ShowcasePanels />
          <ShowcaseFeedback />
          <ShowcaseData />
        </ThemeScope>
      ))}
    </main>
  );
}
