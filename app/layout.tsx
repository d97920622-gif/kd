// path: app/layout.tsx
import { type Metadata, type Viewport } from 'next';

import { PrintMarker } from '@/components/layout/print-marker';
import { MotionProvider } from '@/components/motion/motion-provider';
import { SecurityRuntime } from '@/components/security/security-runtime';
import { TooltipProvider } from '@/components/ui/tooltip';
import { COLOR_THEME_VALUES, type ColorThemeName } from '@/config/design-tokens.ts';
import { ToastProvider } from '@/lib/hooks/use-toast';
import { t } from '@/lib/i18n';
import { siteUrl } from '@/lib/seo/site';
import { hslTripleToHex } from '@/lib/utils/color';

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
 * config/security-headers.ts, applied by next.config.js to every response. The
 * content security policy that needs a per-request nonce is the third owner of
 * the same subject: middleware.ts builds it, because the request is the only
 * place a nonce exists.
 *
 * Sub-step 1.30 adds three things to this file, and each one is here because
 * the document is the only place it can be:
 *
 *   - **The metadata baseline.** `metadataBase` is what lets every page declare
 *     a relative image or link and have it resolve to an absolute URL, the open
 *     graph and Twitter blocks describe the document to a network that has
 *     never seen it, and `robots` states the default that a page may narrow and
 *     a preview build overrides from the outside. All of it is one export: a
 *     page that sets its own title and description inherits the rest.
 *   - **The viewport export.** `themeColor` paints the browser's own chrome
 *     with the background role of the light and the dark theme, so the address
 *     bar of a phone does not sit as a white band above a dark page. The
 *     colours come from the token module, which is the only file allowed to
 *     declare one.
 *   - **The print marker.** A printed page keeps the document and loses the
 *     address bar, so the document prints its own source (see
 *     components/layout/print-marker.tsx). It is mounted here rather than in a
 *     shell because it belongs to the document: a surface that never thought
 *     about paper still carries it.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: t('brand.name'),
    template: `%s | ${t('brand.name')}`,
  },
  description: t('brand.description'),
  applicationName: t('brand.name'),
  openGraph: {
    type: 'website',
    siteName: t('brand.name'),
    title: t('brand.name'),
    description: t('brand.description'),
    url: siteUrl(),
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: t('brand.name'),
    description: t('brand.description'),
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

/**
 * The colour the browser paints its own chrome with, per theme.
 *
 * The value is the background role of the theme, resolved to a hex literal
 * because a browser that reads this tag cannot resolve a CSS custom property
 * declared in a stylesheet it has not loaded yet - the tag is what colours the
 * window before the first paint. A theme with no background role is a
 * programming error rather than a runtime condition: the palette declares all
 * four themes with full parity, and a missing role would paint a black band
 * over a white page on one device in one mode.
 */
function browserThemeColor(theme: ColorThemeName): string {
  const triple = COLOR_THEME_VALUES[theme].background;
  if (triple === undefined) {
    throw new Error(`the ${theme} theme has no background role to paint the browser chrome with`);
  }
  return hslTripleToHex(triple);
}

/**
 * Every document is rendered when it is requested, and the nonce is why.
 *
 * The content security policy this application sends names a nonce, which is a
 * different value on every response. A prerendered document is bytes on disk,
 * rendered once at build time, so there is no response for a nonce to belong
 * to: the scripts Next.js writes into the HTML - the flight payload that
 * hydrates the page - carry no nonce, and a browser enforcing
 * `script-src 'self' 'nonce-...' 'strict-dynamic'` refuses every one of them,
 * because `'strict-dynamic'` ignores the origin list and trusts only scripts
 * that were nonced or that a trusted script created. The first production run
 * of sub-step 1.30 measured exactly that: 39 script elements in the served
 * document and not one nonce among them, which is a site that paints and never
 * hydrates.
 *
 * One line fixes it, and this is the line. A dynamic render happens inside a
 * request, so the framework reads the policy middleware.ts put on the request
 * headers, takes the nonce out of it, and stamps that nonce onto every script it
 * writes. The trade is a server render per page view instead of a file read,
 * which is the price the plan's policy items (FEATURE_LIST 3231 and 3892-3894:
 * a nonce policy with no `unsafe-inline` anywhere in it) ask this product to
 * pay, and step 5 makes the public pages come from the database anyway, at which
 * point there is nothing left to prerender.
 *
 * The routes that are not documents keep their static form, and each says so in
 * its own file: /robots.txt and /sitemap.xml are generated from data that only
 * changes with a release, and the social image is an image. Nothing here needs a
 * nonce, and a crawler gets a file.
 */
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: browserThemeColor('light') },
    { media: '(prefers-color-scheme: dark)', color: browserThemeColor('dark') },
  ],
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
        <PrintMarker />
      </body>
    </html>
  );
}
