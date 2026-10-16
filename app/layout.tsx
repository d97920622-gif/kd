// path: app/layout.tsx
import { type Metadata } from 'next';

import { MotionProvider } from '@/components/motion/motion-provider';
import { SecurityRuntime } from '@/components/security/security-runtime';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ToastProvider } from '@/lib/hooks/use-toast';
import { t } from '@/lib/i18n';

import '../styles/globals.css';
import '../styles/print.css';

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
 * Two stylesheets, both loaded once, here. The global layer carries the
 * tokens and the Tailwind layers; the print base carries what a page becomes
 * on paper, and it is imported at the root rather than per route group because
 * every group can be printed for a reason - an invoice from the workspace, a
 * receipt from the client portal, a pricing page from the public site - and a
 * group that has to remember to import it is a group that will one day forget.
 * A stylesheet that must be present everywhere belongs where everything is.
 *
 * One tooltip provider wraps the whole application. A tooltip has to have a
 * provider above it, and mounting one per page would give each page its own
 * delay and its own layer, which is how two tooltips end up visible at once.
 *
 * One motion provider wraps it too (sub-step 1.25). Motion is a reading
 * preference before it is a design decision: the reader's operating system
 * already says whether they want movement, and one provider above every route
 * is what lets each animated component ask once instead of subscribing to the
 * media query itself. It renders no element of its own beyond Framer Motion's
 * context, so the document structure is unchanged.
 *
 * One toast surface mounts inside those two (sub-step 1.27). A toast is a
 * notice about something that already happened, and the five second undo window
 * is a toast with an action on it, so the queue has to be reachable from any
 * page without that page rendering a stack of its own. It sits below the motion
 * provider because a toast is a motion surface too, and above the pages because
 * that is the point. The live region the provider mounts exists before the
 * first message arrives, which is what a screen reader needs.
 *
 * One security runtime mounts here as well (sub-step 1.26). It declares the
 * Trusted Types policy for the document and renders nothing: a policy is a
 * per-document declaration, `createPolicy` refuses a name that is already taken,
 * and the root layout is the only place that runs exactly once per document.
 * The header half of the same sub-step is not here at all - it is data in
 * config/security-headers.ts, applied by next.config.js to every response.
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
        <MotionProvider>
          <TooltipProvider>
            <ToastProvider>{children}</ToastProvider>
          </TooltipProvider>
        </MotionProvider>
        <SecurityRuntime />
      </body>
    </html>
  );
}
