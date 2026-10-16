// path: app/layout.tsx
import { type Metadata } from 'next';

import { TooltipProvider } from '@/components/ui/tooltip';
import { t } from '@/lib/i18n';

import '../styles/globals.css';

/**
 * The root shell: document language, the stylesheet, the font variables and
 * the document metadata.
 *
 * Every block of the design system is loaded once, here, which is why this
 * file imports the stylesheet directly rather than through a component. The
 * theme classes and the four pinned scopes are declared in that stylesheet,
 * so any page can pin a theme without loading anything else.
 *
 * The fonts are system stacks: `--font-sans` and `--font-mono` are declared
 * in styles/globals.css and the Tailwind font families read those variables,
 * so a page never names a typeface. Step 1 does not ship a self-hosted face:
 * a webfont has to arrive as a local file with subsetting and a preload link
 * (MASTER_PROMPT performance requirements, sub-step 16.9) rather than a
 * download from a font network at build time, because the build has to work
 * on a machine that cannot reach one. When the faces arrive they are pointed
 * at these two variables and no page changes.
 *
 * No theme class is set on the html element by default. Light is the base
 * theme, the `.dark` class is the switch the theme control will set, and the
 * high contrast and reduced motion themes follow the operating system
 * preferences through media queries, so a user who needs them gets them
 * without finding a setting.
 *
 * One tooltip provider wraps the whole application. A tooltip has to have a
 * provider above it, and mounting one per page would give each page its own
 * delay and its own layer, which is how two tooltips end up visible at once.
 */
export const metadata: Metadata = {
  title: {
    default: t('brand.name'),
    template: `%s | ${t('brand.name')}`,
  },
  description: t('brand.description'),
};

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-base text-foreground antialiased">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
